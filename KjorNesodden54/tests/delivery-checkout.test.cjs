const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const pricing = load('../src/services/deliveryPricing.ts');
const item = (id = 'mama') => ({ type: 'restaurant', productId: id, restaurantId: id,
  restaurantName: id, productName: 'Pizza', price: 149, quantity: 1 });
function setup() {
  const state = {
    pricing: JSON.parse(JSON.stringify(pricing.defaultDeliveryPricing)),
    profile: { role: 'customer', name: 'Customer', phone: '99999999', address: 'Testveien 1', deliveryAreaId: 'tangen', deliveryFee: 75 },
    restaurants: {
      mama: { id: 'mama', name: 'Mama', deliveryAreaId: 'fagerstrand', active: true, openingHours: [] },
      jafs: { id: 'jafs', name: 'JAFS', deliveryAreaId: 'tangen', active: true, openingHours: [] },
    },
    sent: [], requests: [], priceReadFailure: false, priceReads: 0, apiFailure: false,
  };
  const service = load('../src/services/orderService.ts', {
    './deliveryPricing': pricing,
    './deliveryPricingService': { getDeliveryPricingFromServer: async () => {
      state.priceReads++; if (state.priceReadFailure) throw new Error('Offline'); return state.pricing;
    } },
    './profileService': { getCurrentProfile: async () => state.profile },
    './restaurantService': { getRestaurantById: async (id, fresh) => {
      assert.equal(fresh, true); return state.restaurants[id] ?? null;
    } },
    './restaurantRequestService': { createRestaurantRequests: async (...args) => {
      state.requests.push(args); return { orderGroupId: 'order' };
    } },
    './openingHoursService': { openingStatus: (hours) => ({ open: hours !== 'closed', text: 'Åpent' }) },
  }, {
    process: { env: { EXPO_PUBLIC_ORDER_API_URL: 'https://orders.invalid/api/send' } },
    fetch: async (_url, options) => {
      state.sent.push(JSON.parse(options.body));
      return { ok: !state.apiFailure, json: async () => ({ error: 'Rejected' }) };
    },
    console: { log() {} },
  });
  return { state, ...service };
}

test('local delivery ignores obsolete profile money and sends exactly the confirmed amount', async () => {
  const app = setup(); app.state.profile.deliveryAreaId = 'fagerstrand';
  const quote = await app.prepareCartDelivery([item()]); assert.equal(quote.fee, 100);
  await app.submitCartOrder([item()], 149, quote);
  assert.match(app.state.sent[0].description, /Levering: 100 kr/);
  assert.match(app.state.sent[0].description, /249 kr/);
  assert.equal(app.state.requests[0][3].fee, 100);
});
test('Fjellstrand to Fjellstrand uses its normal 150 kr rate in the quote and order', async () => {
  const app = setup();
  app.state.profile.deliveryAreaId = 'fjellstrand';
  app.state.restaurants.mama.deliveryAreaId = 'fjellstrand';
  app.state.pricing.sameAreaFee = 70;
  const quote = await app.prepareCartDelivery([item()]);
  assert.equal(quote.fee, 150);
  assert.equal(quote.routes[0].local, false);
  await app.submitCartOrder([item()], 149, quote);
  assert.match(app.state.sent[0].description, /Levering: 150 kr/);
  assert.match(app.state.sent[0].description, /299 kr/);
  assert.equal(app.state.requests[0][3].fee, 150);
});
test('Fagerstrand to Tangen is quoted, sent and recorded as 250', async () => {
  const app = setup(), quote = await app.prepareCartDelivery([item()]);
  assert.equal(quote.fee, 250); await app.submitCartOrder([item()], 149, quote);
  assert.match(app.state.sent[0].description, /Levering: 250 kr/);
  assert.match(app.state.sent[0].description, /399 kr/);
  assert.equal(app.state.requests[0][3].fee, 250);
});
for (const change of ['price', 'address', 'restaurant area', 'cart']) {
  test(`a changed ${change} requires confirmation again before any order is sent`, async () => {
    const app = setup(), items = [item()], quote = await app.prepareCartDelivery(items);
    let total = 149;
    if (change === 'price') app.state.pricing = { ...app.state.pricing, revision: 1,
      areaFees: { ...app.state.pricing.areaFees, fagerstrand: 300 } };
    if (change === 'address') app.state.profile = { ...app.state.profile, address: 'Testveien 2', deliveryAreaId: 'fagerstrand' };
    if (change === 'restaurant area') app.state.restaurants.mama.deliveryAreaId = 'tangen';
    if (change === 'cart') { items[0].quantity = 2; total = 298; }
    await assert.rejects(app.submitCartOrder(items, total, quote), /bekreft på nytt/);
    assert.equal(app.state.sent.length, 0); assert.equal(app.state.requests.length, 0);
  });
}
test('a failed server price check blocks submission', async () => {
  const app = setup(), quote = await app.prepareCartDelivery([item()]);
  app.state.priceReadFailure = true;
  await assert.rejects(app.submitCartOrder([item()], 149, quote), /Offline/);
  assert.equal(app.state.sent.length, 0); assert.equal(app.state.requests.length, 0);
});
for (const status of ['missing', 'inactive', 'closed']) {
  test(`a ${status} restaurant cannot receive an order`, async () => {
    const app = setup();
    if (status === 'missing') delete app.state.restaurants.mama;
    if (status === 'inactive') app.state.restaurants.mama.active = false;
    if (status === 'closed') app.state.restaurants.mama.openingHours = 'closed';
    await assert.rejects(app.prepareCartDelivery([item()])); assert.equal(app.state.sent.length, 0);
  });
}
test('multiple restaurants incur the highest delivery price once', async () => {
  const app = setup(), items = [item(), item('jafs')], quote = await app.prepareCartDelivery(items);
  assert.equal(quote.fee, 250); await app.submitCartOrder(items, 298, quote);
  assert.match(app.state.sent[0].description, /548 kr/); assert.equal(app.state.requests[0][3].fee, 250);
});
test('unknown customer area means an agreed price, with no invented total', async () => {
  const app = setup(); app.state.profile.deliveryAreaId = null;
  const quote = await app.prepareCartDelivery([item()]); assert.equal(quote.fee, null);
  await app.submitCartOrder([item()], 149, quote);
  assert.match(app.state.sent[0].description, /Levering: Pris avtales/);
  assert.doesNotMatch(app.state.sent[0].description, /Totalt varer og levering/);
});
test('custom-only orders do not borrow a restaurant delivery rate', async () => {
  const app = setup(), items = [{ ...item(), type: 'custom', price: 0, customPlace: 'Kiwi', customRequest: 'Brød' }];
  const quote = await app.prepareCartDelivery(items); assert.equal(quote.fee, null);
  await app.submitCartOrder(items, 0, quote);
  assert.equal(app.state.priceReads, 0); assert.equal(app.state.requests.length, 0);
  assert.match(app.state.sent[0].description, /Pris avtales/);
});
test('an incorrect subtotal or missing confirmation cannot be submitted', async () => {
  const app = setup(), quote = await app.prepareCartDelivery([item()]);
  await assert.rejects(app.submitCartOrder([item()], 1, quote), /Varesummen/);
  await assert.rejects(app.submitCartOrder([item()], 149), /bekreft på nytt/);
  assert.equal(app.state.sent.length, 0);
});
test('an API failure does not create restaurant requests', async () => {
  const app = setup(), quote = await app.prepareCartDelivery([item()]); app.state.apiFailure = true;
  await assert.rejects(app.submitCartOrder([item()], 149, quote), /Rejected/);
  assert.equal(app.state.requests.length, 0);
});
