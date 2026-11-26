const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
function setup() {
  const writes = []; let committed = 0, nextId = 0;
  const firestore = {
    collection: (_db, name) => ({ collection: name }),
    doc: (ref, id, explicitId) => typeof ref === 'string' ? {} :
      ref.collection ? { collection: ref.collection, id: id ?? `id${++nextId}` } : { collection: id, id: explicitId },
    getDoc: async () => ({ exists: () => true, data: () => ({ role: 'customer' }) }),
    writeBatch: () => ({ set: (ref, value) => writes.push({ ref, value }), commit: async () => { committed++; } }),
    serverTimestamp: () => 'server-time',
  };
  const service = load('../src/services/restaurantRequestService.ts', {
    'firebase/firestore': firestore,
    './firebase': { auth: { currentUser: { uid: 'user1' } }, db: {} },
  });
  return { ...service, writes, committed: () => committed };
}
const item = (id) => ({ type: 'restaurant', restaurantId: id, restaurantName: id, productId: id, productName: 'Mat', price: 50, quantity: 1 });
const custom = { ...item('butikk'), type: 'custom', customRequest: 'Brød' };
const quote = { fee: 150, customerAreaId: 'tangen', revision: 1, routes: [{ restaurantId: 'r1', fee: 150, restaurantAreaId: 'fjellstrand' }] };
test('mixed order and restaurant requests share one atomic batch and order ID', async () => {
  const app = setup();
  const result = await app.createRestaurantRequests([item('r1')], 'Kunde', '123', quote, { address: 'Gate 1', coordinates: { latitude: 59.8, longitude: 10.6 }, items: [item('r1'), custom], totalPrice: 50 });
  assert.equal(app.committed(), 1); assert.equal(app.writes.length, 2);
  const group = app.writes.find(w => w.ref.collection === 'orderGroups');
  const request = app.writes.find(w => w.ref.collection === 'restaurantRequests');
  assert.equal(group.ref.id, result.orderGroupId); assert.equal(request.value.orderGroupId, result.orderGroupId);
  assert.equal(group.value.items.length, 2); assert.equal(group.value.items[1].customRequest, 'Brød');
  assert.equal(group.value.coordinates.latitude, 59.8);
});
test('custom-only checkout creates an order without a restaurant request', async () => {
  const app = setup();
  await app.createRestaurantRequests([], 'Kunde', '123', { ...quote, fee: null, routes: [] }, { address: 'Gate 1', coordinates: null, items: [custom], totalPrice: 0 });
  assert.equal(app.committed(), 1); assert.equal(app.writes.length, 1);
  assert.equal(app.writes[0].ref.collection, 'orderGroups');
});
