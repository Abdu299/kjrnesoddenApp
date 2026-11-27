const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
function setup({role='admin',status='confirmed'}={}) {
  const state = { role, status, writes: [], requestStatus: 'pending', user: {uid:'admin1'} };
  const snap=(ref,data,exists=true)=>({ref,exists:()=>exists,data:()=>data});
  const requestRef={path:'restaurantRequests/r1'};
  const fs={ collection:(_db,...path)=>({path:path.join('/')}),doc:(first,...parts)=>({path:[first.path||'',...parts].filter(Boolean).join('/') || 'notification'}),
    where:(...args)=>args, query:(ref,filter)=>({ref,filter}), serverTimestamp:()=> 'SERVER_TIME',
    getDocsFromServer:async()=>({size:1,docs:[{ref:requestRef}]}),
    runTransaction:async (_db,cb)=>cb({ get:async ref=>ref.path==='orderGroups/order1'?snap(ref,{status:state.status,customerId:'customer1'}):ref.path==='users/admin1'?snap(ref,{role:state.role}):snap(ref,{orderGroupId:'order1',status:state.requestStatus}),
      update:(ref,data)=>state.writes.push({path:ref.path,data}),set:(ref,data)=>state.writes.push({path:ref.path,data}) }) };
  const service=load('../src/services/adminRequestService.ts',{'firebase/firestore':fs,'./firebase':{auth:{currentUser:state.user},db:{}}});
  return {state,...service};
}
test('cancellation updates parent and pending restaurant request and creates customer notice',async()=>{
 const app=setup(); await app.cancelCustomerRequest('order1', 'Restauranten stenger');
 assert.equal(app.state.writes.length,3);
 assert.equal(app.state.writes.find(w=>w.path==='orderGroups/order1').data.status,'cancelled');
 assert.equal(app.state.writes[0].data.cancellation.reason, 'Restauranten stenger');
 assert.equal(app.state.writes.find(w=>w.path==='restaurantRequests/r1').data.status,'cancelled');
 assert.equal(app.state.writes.find(w=>w.data.event==='cancelled').data.orderId,'order1');
});
test('completed restaurant requests are retained',async()=>{const app=setup();app.state.requestStatus='completed';await app.cancelCustomerRequest('order1', 'Restauranten stenger');assert.equal(app.state.writes.some(w=>w.path==='restaurantRequests/r1'),false);});
test('a delivered order or a non-admin cannot be cancelled',async()=>{const a=setup({status:'delivered'});await assert.rejects(a.cancelCustomerRequest('order1', 'Restauranten stenger'),/allerede levert/);const b=setup({role:'customer'});await assert.rejects(b.cancelCustomerRequest('order1', 'Restauranten stenger'),/ikke tilgang/);assert.equal(b.state.writes.length,0);});
