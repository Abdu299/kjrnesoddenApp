const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, collection, getDoc, getDocs, query, where, runTransaction, updateDoc, serverTimestamp } = require('firebase/firestore');
let env;
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-kjor', firestore: { rules: readFileSync('firestore(4).rules', 'utf8') } });
  await env.withSecurityRulesDisabled(async ctx => {
    const { setDoc } = require('firebase/firestore'); const db = ctx.firestore();
    await Promise.all([
      setDoc(doc(db, 'users/a'), {role:'worker', active:true}), setDoc(doc(db, 'users/b'), {role:'worker', active:true}),
      setDoc(doc(db, 'users/inactive'), {role:'worker', active:false}), setDoc(doc(db, 'users/customer'), {role:'customer',name:'Kunde',phone:'123'}), setDoc(doc(db, 'users/admin'), {role:'admin'}),
      setDoc(doc(db, 'orderGroups/legacy'), {customerId:'customer', status:'placed'}),
      setDoc(doc(db, 'orderGroups/release'), {customerId:'customer', status:'ready', assignmentStatus:'assigned', assignedWorkerId:'b'}),
      setDoc(doc(db, 'orderGroups/picked'), {customerId:'customer', status:'picked_up', assignmentStatus:'assigned', assignedWorkerId:'b'}),
      setDoc(doc(db, 'orderGroups/order'), {customerId:'customer', assignmentStatus:'available', assignedWorkerId:null, status:'ready', deliveryFee:100}),
    ]);
  });
});
after(async () => { if (env) await env.cleanup(); });
test('active worker queries and atomic assignment; other and deactivated workers are denied', async () => {
  const dbA = env.authenticatedContext('a').firestore(); const dbB = env.authenticatedContext('b').firestore(); const dbInactive = env.authenticatedContext('inactive').firestore();
  await assertSucceeds(getDocs(query(collection(dbA, 'orderGroups'), where('assignmentStatus', '==', 'available'))));
  await assertFails(getDocs(query(collection(dbInactive, 'orderGroups'), where('assignmentStatus', '==', 'available'))));
  const claim = db => runTransaction(db, async tx => { const ref = doc(db,'orderGroups/order'); const s = await tx.get(ref); if (s.data().assignmentStatus !== 'available') throw Error('taken'); tx.update(ref,{ assignmentStatus:'assigned', assignedWorkerId:db === dbA ? 'a' : 'b', assignedAt:serverTimestamp() }); });
  const results = await Promise.allSettled([claim(dbA), claim(dbB)]);
  if (results.filter(r => r.status === 'fulfilled').length !== 1) throw Error('Expected exactly one successful assignment: ' + JSON.stringify(results));
  const winner = results[0].status === 'fulfilled' ? dbA : dbB, loser = winner === dbA ? dbB : dbA;
  await assertFails(getDoc(doc(loser, 'orderGroups/order')));
  await assertSucceeds(getDocs(query(collection(winner,'orderGroups'), where('assignedWorkerId','==', winner === dbA ? 'a' : 'b'))));
  await assertFails(updateDoc(doc(winner,'orderGroups/order'), {status:'delivered', statusUpdatedAt:serverTimestamp(), assignmentStatus:'completed', completedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(winner,'orderGroups/order'), {status:'picked_up', statusUpdatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(winner,'orderGroups/order'), {status:'on_the_way', statusUpdatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(winner,'orderGroups/order'), {status:'delivered', statusUpdatedAt:serverTimestamp(), assignmentStatus:'completed', completedAt:serverTimestamp()}));
});

test('only an admin can enable legacy orders, provision or deactivate workers', async () => {
  const admin = env.authenticatedContext('admin').firestore(), customer = env.authenticatedContext('customer').firestore(), worker = env.authenticatedContext('a').firestore();
  const { setDoc } = require('firebase/firestore');
  await assertFails(updateDoc(doc(customer,'users/customer'), { role:'worker', active:true }));
  await assertFails(setDoc(doc(customer,'users/new-worker'), {role:'worker', name:'New', email:'new@example.com', active:true, createdAt:serverTimestamp()}));
  await assertSucceeds(setDoc(doc(admin,'users/new-worker'), {role:'worker', name:'New', email:'new@example.com', active:true, createdAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(worker,'orderGroups/legacy'), {assignmentStatus:'available', assignedWorkerId:null, madeAvailableAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admin,'orderGroups/legacy'), {assignmentStatus:'available', assignedWorkerId:null, madeAvailableAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(admin,'users/a'), {active:false}));
  await assertFails(getDocs(query(collection(worker,'orderGroups'), where('assignmentStatus','==','available'))));
});

test('customer can create an available order and cannot assign it to a worker', async () => {
  const db = env.authenticatedContext('customer').firestore(), { setDoc } = require('firebase/firestore');
  const data = { customerId:'customer',customerName:'Kunde',customerPhone:'123',address:'Gate 1',coordinates:null,items:[{productName:'Mat'}],totalPrice:50,deliveryFee:null,status:'placed',createdAt:serverTimestamp(),statusUpdatedAt:serverTimestamp(),assignmentStatus:'available',assignedWorkerId:null };
  await assertFails(setDoc(doc(db,'orderGroups/forged'), { ...data, assignmentStatus:'assigned',assignedWorkerId:'b' }));
  await assertSucceeds(setDoc(doc(db,'orderGroups/new'), data));
});

test('only an admin can release an assignment before pickup', async () => {
  const admin = env.authenticatedContext('admin').firestore(), worker = env.authenticatedContext('b').firestore();
  const changes = { assignmentStatus:'available', assignedWorkerId:null, releasedAt:serverTimestamp() };
  await assertFails(updateDoc(doc(worker,'orderGroups/release'), changes));
  await assertFails(updateDoc(doc(admin,'orderGroups/picked'), changes));
  await assertSucceeds(updateDoc(doc(admin,'orderGroups/release'), changes));
});

test('unknown or unapproved delivery fee blocks pickup even for admins', async () => {
  const { setDoc } = require('firebase/firestore');
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db,'users/driver'),{role:'worker',active:true});
    await setDoc(doc(db,'orderGroups/unpriced'),{customerId:'customer',status:'ready',assignmentStatus:'assigned',assignedWorkerId:'driver',deliveryFee:null});
    await setDoc(doc(db,'orderGroups/pendingfee'),{customerId:'customer',status:'ready',assignmentStatus:'assigned',assignedWorkerId:'driver',deliveryFee:100,feeProposal:{status:'pending'}});
  });
  const driver = env.authenticatedContext('driver').firestore(), admin = env.authenticatedContext('admin').firestore(), customer = env.authenticatedContext('customer').firestore();
  await assertFails(updateDoc(doc(driver,'orderGroups/unpriced'), {status:'picked_up',statusUpdatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(admin,'orderGroups/unpriced'), {status:'picked_up',statusUpdatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(driver,'orderGroups/pendingfee'), {status:'picked_up',statusUpdatedAt:serverTimestamp()}));
  await assertFails(updateDoc(doc(customer,'orderGroups/pendingfee'), {deliveryFee:0,feeProposal:{status:'approved'}}));
});

test('customers can only access their own notification inbox and push tokens', async () => {
  const { setDoc }=require('firebase/firestore');
  const mine=env.authenticatedContext('customer').firestore(), other=env.authenticatedContext('b').firestore();
  await env.withSecurityRulesDisabled(async ctx=>setDoc(doc(ctx.firestore(),'users/customer/notifications/n1'),{title:'Bekreftet',orderId:'order',read:false}));
  await assertSucceeds(getDoc(doc(mine,'users/customer/notifications/n1')));
  await assertFails(getDoc(doc(other,'users/customer/notifications/n1')));
  await assertFails(setDoc(doc(mine,'users/customer/notifications/fake'),{title:'fake',read:false}));
  await assertSucceeds(updateDoc(doc(mine,'users/customer/notifications/n1'),{read:true}));
  await assertFails(updateDoc(doc(mine,'users/customer/notifications/n1'),{title:'changed'}));
  await assertSucceeds(setDoc(doc(mine,'users/customer/pushTokens/t1'),{token:'ExpoPushToken[test]',updatedAt:serverTimestamp()}));
  await assertFails(getDoc(doc(other,'users/customer/pushTokens/t1')));
});

test('fee proposal and response require matching order and history writes', async () => {
  const { setDoc }=require('firebase/firestore');
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore(); await setDoc(doc(db,'users/wfee'),{role:'worker',active:true}); await setDoc(doc(db,'orderGroups/freefee'),{customerId:'customer',status:'ready',deliveryFee:null,assignedWorkerId:'wfee',assignmentStatus:'assigned'});});
  const worker=env.authenticatedContext('wfee').firestore(), other=env.authenticatedContext('b').firestore(), customer=env.authenticatedContext('customer').firestore();
  const proposal={id:'offer1',previousFee:null,proposedFee:150,reason:'Lang rute',proposedBy:'wfee',status:'pending',proposedAt:serverTimestamp()};
  const create = db => runTransaction(db,async tx=>{tx.update(doc(db,'orderGroups/freefee'),{feeProposal:proposal});tx.set(doc(db,'orderGroups/freefee/feeHistory/offer1'),proposal);tx.set(doc(db,'users/customer/notifications/fee1'),{title:'Du har fått et nytt leveringsprisforslag',orderId:'freefee',createdAt:serverTimestamp(),read:false,pushState:'pending',event:'fee'});});
  await assertFails(create(other));
  await assertFails(updateDoc(doc(worker,'orderGroups/freefee'),{feeProposal:proposal}));
  await assertSucceeds(create(worker));
  await assertFails(updateDoc(doc(customer,'orderGroups/freefee'),{deliveryFee:0}));
  await assertSucceeds(runTransaction(customer,async tx=>{const order=doc(customer,'orderGroups/freefee'), history=doc(customer,'orderGroups/freefee/feeHistory/offer1');const snap=await tx.get(order); const p=snap.data().feeProposal;const answer={...p,status:'approved',respondedAt:serverTimestamp(),respondedBy:'customer'};tx.update(order,{feeProposal:answer,deliveryFee:150});tx.update(history,{status:'approved',respondedAt:serverTimestamp(),respondedBy:'customer'});}));
  const updated=await getDoc(doc(customer,'orderGroups/freefee')); if(updated.data().deliveryFee!==150) throw Error('fee not applied');
});

test('an assigned worker can atomically save an order update and customer inbox item, but cannot forge one', async () => {
  const {setDoc}=require('firebase/firestore');
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'users/wpush'),{role:'worker',active:true});await setDoc(doc(db,'orderGroups/push-order'),{customerId:'customer',status:'ready',deliveryFee:100,assignmentStatus:'assigned',assignedWorkerId:'wpush'});});
  const worker=env.authenticatedContext('wpush').firestore();
  const notice={title:'Bestillingen er hentet',orderId:'push-order',createdAt:serverTimestamp(),read:false,pushState:'pending',event:'picked_up'};
  await assertFails(setDoc(doc(worker,'users/customer/notifications/forged'),notice));
  await assertSucceeds(runTransaction(worker,async tx=>{tx.update(doc(worker,'orderGroups/push-order'),{status:'picked_up',statusUpdatedAt:serverTimestamp()});tx.set(doc(worker,'users/customer/notifications/genuine'),notice);}));
});

test('admin cancellation atomically updates the order, restaurant request and customer notification', async () => {
  const { setDoc }=require('firebase/firestore');
  await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();await setDoc(doc(db,'orderGroups/admin-cancel'),{customerId:'customer',customerName:'Kunde',status:'confirmed',deliveryFee:100});await setDoc(doc(db,'users/restaurant-cancel-test'),{role:'restaurant',restaurantId:'r1'});await setDoc(doc(db,'restaurantRequests/admin-cancel-r'),{orderGroupId:'admin-cancel',restaurantId:'r1',customerId:'customer',status:'pending'});});
  const admin=env.authenticatedContext('admin').firestore();
  await assertSucceeds(runTransaction(admin,async tx=>{const order=doc(admin,'orderGroups/admin-cancel'), request=doc(admin,'restaurantRequests/admin-cancel-r');await Promise.all([tx.get(order),tx.get(request)]);tx.update(order,{status:'cancelled',statusUpdatedAt:serverTimestamp()});tx.update(request,{status:'cancelled',cancelledAt:serverTimestamp()});tx.set(doc(admin,'users/customer/notifications/admin-cancel'),{title:'Bestillingen er kansellert',orderId:'admin-cancel',createdAt:serverTimestamp(),read:false,pushState:'pending',event:'cancelled'});}));
  const customer=env.authenticatedContext('customer').firestore();assert.equal((await getDoc(doc(customer,'orderGroups/admin-cancel'))).data().status,'cancelled');
  const restaurant=env.authenticatedContext('restaurant-cancel-test').firestore();await assertFails(updateDoc(doc(restaurant,'restaurantRequests/admin-cancel-r'),{status:'completed',completedAt:serverTimestamp()}));
});


test('worker claims a placed order and creates its customer notification atomically', async () => {
  const worker = env.authenticatedContext('b').firestore();
  const customer = env.authenticatedContext('customer').firestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const { setDoc } = require('firebase/firestore');
    await setDoc(doc(ctx.firestore(), 'orderGroups/claim-notice'), {
      customerId: 'customer', status: 'placed', assignmentStatus: 'available',
      assignedWorkerId: null, deliveryFee: null,
    });
  });
  const order = doc(worker, 'orderGroups/claim-notice');
  const noticePath = 'users/customer/notifications/claim-notice';
  const claim = (title) => runTransaction(worker, async tx => {
    await tx.get(order);
    tx.update(order, { assignmentStatus: 'assigned', assignedWorkerId: 'b', assignedAt: serverTimestamp() });
    tx.set(doc(worker, noticePath), {
      title, orderId: 'claim-notice', createdAt: serverTimestamp(), read: false,
      pushState: 'pending', event: 'assigned',
    });
  });
  await assertFails(claim('Feil varsel'));
  assert.equal((await getDoc(order)).data().assignmentStatus, 'available');
  await assertSucceeds(claim('En sjåfør har tatt oppdraget'));
  assert.equal((await getDoc(order)).data().assignedWorkerId, 'b');
  assert.equal((await getDoc(doc(customer, noticePath))).data().event, 'assigned');
});

test('worker lookup includes active restaurants without exposing inactive records', async () => {
  const worker = env.authenticatedContext('b').firestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const { setDoc } = require('firebase/firestore');
    await setDoc(doc(ctx.firestore(), 'restaurants/open'), { active: true, pickupAddress: 'Gate 1' });
    await setDoc(doc(ctx.firestore(), 'restaurants/closed'), { active: false, pickupAddress: 'Gate 2' });
  });
  const ref = collection(worker, 'restaurants');
  await assertFails(getDocs(ref));
  const result = await assertSucceeds(getDocs(query(ref, where('active', '==', true))));
  assert.deepEqual(result.docs.map(entry => entry.id), ['open']);
});
