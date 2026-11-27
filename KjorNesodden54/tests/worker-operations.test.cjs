const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
function setup(status = 'ready') {
  const auth = { currentUser: { uid: 'worker-a' } };
  let order = { assignmentStatus: 'available', assignedWorkerId: null, status };
  const db = {}; let chain = Promise.resolve();
  const firestore = {
    collection: (_db, ...path) => ({ path }), doc: (_db, collection, id) => ({ collection, id }), serverTimestamp: () => 'server-time',
    runTransaction: async (_db, callback) => {
      let release; const old = chain; chain = new Promise(resolve => { release = resolve; }); await old;
      try { return await callback({ set: () => {}, get: async () => ({ exists: () => true, data: () => ({ ...order }) }), update: (_ref, changes) => { order = { ...order, ...changes }; } }); }
      finally { release(); }
    },
  };
  const service = load('../src/services/workerService.ts', { 'firebase/app': {}, 'firebase/auth': {}, 'firebase/firestore': firestore, './firebase': { db, auth, firebaseConfig: {} } });
  return { ...service, auth, read: () => order };
}
test('only one worker can take an order; repeating a successful claim is harmless', async () => {
  const app = setup(); await app.takeOrder('order'); await app.takeOrder('order');
  assert.equal(app.read().assignedWorkerId, 'worker-a');
  app.auth.currentUser = { uid: 'worker-b' };
  await assert.rejects(app.takeOrder('order'), /ikke lenger ledig/);
  assert.equal(app.read().assignedWorkerId, 'worker-a');
});
test('only the assigned worker can finish directly from received', async () => {
  const app = setup('placed');
  await app.takeOrder('order');
  app.auth.currentUser = { uid: 'worker-b' };
  await assert.rejects(app.advanceDelivery('order', 'delivered'), /ikke tildelt deg/);
  app.auth.currentUser = { uid: 'worker-a' };
  await app.advanceDelivery('order', 'delivered');
  await app.advanceDelivery('order', 'delivered');
  assert.equal(app.read().status, 'delivered');
  assert.equal(app.read().assignmentStatus, 'completed');
  assert.equal(app.read().completedAt, 'server-time');
  assert.equal(app.isActiveWorkerOrder(app.read()), false);
});
