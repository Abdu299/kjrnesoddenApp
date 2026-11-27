const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { groupOrdersByDriver, matchesAdminOrder, getHistoryDriver } = load('../src/services/adminOrderHistory.ts');

test('history groups orders by driver ID and keeps orders cancelled by admin with no driver', () => {
  const names = new Map([['a', 'Alex'], ['b', 'Alex']]);
  const orders = [
    { id: 'order1', assignedWorkerId: 'a' },
    { id: 'order2', assignedWorkerId: 'b' },
    { id: 'order3', status: 'cancelled', cancellation: { role: 'admin', name: 'Kari', reason: 'Restauranten stengte' } },
  ];
  const groups = groupOrdersByDriver(orders, names);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].name, 'Alex');
  assert.equal(groups[1].name, 'Alex');
  assert.equal(groups[2].orders[0].id, 'order3');
  assert.equal(groups[2].name, 'Ingen registrert sjåfør');
});

test('search finds orders by short ID, worker, item or cancellation message', () => {
  const order = {
    id: 'orderABC123', assignedWorkerId: 'w', customerName: 'Åse',
    items: [{ productName: 'Burger', restaurantName: 'Jafs' }],
    cancellation: { role: 'admin', name: 'Kari', reason: 'Restauranten stengte' },
  };
  const driver = getHistoryDriver(order, new Map([['w', 'Mona']]));
  assert.ok(matchesAdminOrder(order, driver, '#ABC123 Mona'));
  assert.ok(matchesAdminOrder(order, driver, 'ÅSE burger'));
  assert.ok(matchesAdminOrder(order, driver, 'admin kari stengte'));
  assert.equal(matchesAdminOrder(order, driver, 'pizza'), false);
});
