const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const { getFirestore } = createRequire(require.resolve('../functions/index.js'))('firebase-admin/firestore');
const { proposeDeliveryFee, respondToDeliveryFee, orderNotifications } = require('../functions/index');
const db = getFirestore();
const call = (fn, uid, data) => fn.run({auth:{uid},data});
test('fee proposals require assigned worker or admin and customer approval', async () => {
  await Promise.all([db.doc('users/customer').set({role:'customer'}),db.doc('users/worker').set({role:'worker',active:true}),db.doc('users/other').set({role:'worker',active:true})]);
  const ref = db.doc('orderGroups/fee-test');
  await ref.set({customerId:'customer',assignedWorkerId:'worker',assignmentStatus:'assigned',status:'ready',deliveryFee:null});
  await assert.rejects(call(proposeDeliveryFee,'other',{orderId:'fee-test',amount:150,reason:'Lang rute'}));
  const {proposalId} = await call(proposeDeliveryFee,'worker',{orderId:'fee-test',amount:150,reason:'Lang rute'});
  let order=(await ref.get()).data(); assert.equal(order.deliveryFee,null); assert.equal(order.feeProposal.status,'pending');
  await assert.rejects(call(respondToDeliveryFee,'other',{orderId:'fee-test',proposalId,accept:true}));
  await call(respondToDeliveryFee,'customer',{orderId:'fee-test',proposalId,accept:true});
  await call(respondToDeliveryFee,'customer',{orderId:'fee-test',proposalId,accept:true});
  order=(await ref.get()).data(); assert.equal(order.deliveryFee,150); assert.equal(order.feeProposal.status,'approved');
  assert.equal((await ref.collection('feeHistory').doc(proposalId).get()).data().status,'approved');
});
test('repeated delivery of a database event produces only one inbox item', async () => {
  const event={id:'event-123',params:{orderId:'fee-test'},data:{before:{data:()=>({status:'placed'})},after:{data:()=>({customerId:'customer',status:'confirmed'})}}};
  await orderNotifications.run(event); await orderNotifications.run(event);
  const snap=await db.collection('users/customer/notifications').get(); assert.equal(snap.size,1); assert.equal(snap.docs[0].data().orderId,'fee-test');
});
test('customer may decline a new fee without changing the previous amount', async () => {
  const ref=db.doc('orderGroups/fee-decline');
  await ref.set({customerId:'customer',assignedWorkerId:'worker',assignmentStatus:'assigned',status:'ready',deliveryFee:100});
  const {proposalId}=await call(proposeDeliveryFee,'worker',{orderId:'fee-decline',amount:250,reason:'Endret rute'});
  await assert.rejects(call(proposeDeliveryFee,'worker',{orderId:'fee-decline',amount:300,reason:'Dobbel forespørsel'}));
  await call(respondToDeliveryFee,'customer',{orderId:'fee-decline',proposalId,accept:false});
  const order=(await ref.get()).data(); assert.equal(order.deliveryFee,100); assert.equal(order.feeProposal.status,'declined');
  assert.equal((await ref.collection('feeHistory').doc(proposalId).get()).data().status,'declined');
});
