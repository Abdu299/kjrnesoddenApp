const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');

const driver = { latitude: 59.86, longitude: 10.66 };
const pickup = { latitude: 59.82, longitude: 10.64 };
const customer = { latitude: 59.79, longitude: 10.61 };

test('direct driving estimate uses only driver and customer positions', async () => {
  const signal = new AbortController().signal;
  const { drivingLegs } = load('../src/services/workerDriving.ts', {}, {
    process: { env: { EXPO_PUBLIC_GEOAPIFY_ROUTING_KEY: 'test-key' } },
    fetch: async (url, options) => {
      const query = new URL(url).searchParams;
      assert.equal(query.get('mode'), 'drive');
      assert.equal(query.get('waypoints'), '59.86,10.66|59.79,10.61');
      assert.equal(options.signal, signal);
      return { ok: true, json: async () => ({ features: [{ properties: { legs: [{ time: 700, distance: 8200 }] } }] }) };
    },
  });
  const [direct] = await drivingLegs([driver, customer], signal);
  assert.equal(direct.seconds, 700);
  assert.equal(direct.meters, 8200);
});

test('pickup route preserves distinct legs and rejects incomplete routes', async () => {
  const signal = new AbortController().signal;
  let legs = [{ duration: 320, distance: 3400 }, { duration: 400, distance: 5100 }];
  const { drivingLegs } = load('../src/services/workerDriving.ts', {}, {
    process: { env: { EXPO_PUBLIC_ROUTING_URL: 'https://routing.example/' } },
    fetch: async url => {
      assert.match(url, /\/route\/v1\/driving\/10.66,59.86;10.64,59.82;10.61,59.79/);
      return { ok: true, json: async () => ({ routes: [{ legs }] }) };
    },
  });
  const [toPickup, toCustomer] = await drivingLegs([driver, pickup, customer], signal);
  assert.equal(toPickup.seconds + toCustomer.seconds, 720);
  legs = legs.slice(0, 1);
  await assert.rejects(drivingLegs([driver, pickup, customer], signal), /Fant ingen kjørerute/);
});
