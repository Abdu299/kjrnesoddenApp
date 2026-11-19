const { test } = require("node:test");
const assert = require("node:assert/strict");
const exportsObject = require("./load-typescript.cjs")("../src/services/deliveryPricing.ts");
const { defaultDeliveryPricing: prices, deliveryAreas, routeDeliveryFee, quoteDelivery,
  parseDeliveryPricing, restaurantDeliveryArea } = exportsObject;
const restaurant = (id, area) => ({ id, name: id, deliveryAreaId: area });

test("all 25 routes use the local price or the highest area rate, in either direction", () => {
  for (const pickup of deliveryAreas) for (const destination of deliveryAreas) {
    const expected = pickup.id === destination.id ? 100 : Math.max(prices.areaFees[pickup.id], prices.areaFees[destination.id]);
    assert.equal(routeDeliveryFee(pickup.id, destination.id, prices), expected);
    assert.equal(routeDeliveryFee(destination.id, pickup.id, prices), expected);
  }
});

test("the requested Fagerstrand examples and Fjellstrand rates", () => {
  assert.equal(routeDeliveryFee("fagerstrand", "fagerstrand", prices), 100);
  assert.equal(routeDeliveryFee("fagerstrand", "tangen", prices), 250);
  assert.equal(routeDeliveryFee("tangen", "fagerstrand", prices), 250);
  assert.equal(routeDeliveryFee("fjellstrand", "tangen", prices), 150);
  assert.equal(routeDeliveryFee("fjellstrand", "fjellstrand", prices), 100);
});

test("an admin price edit changes every affected route without modifying unrelated routes", () => {
  const edited = { ...prices, revision: 1, sameAreaFee: 110, areaFees: { ...prices.areaFees, fagerstrand: 300 } };
  for (const destination of deliveryAreas) {
    assert.equal(routeDeliveryFee("fagerstrand", destination.id, edited), destination.id === "fagerstrand" ? 110 : 300);
    assert.equal(routeDeliveryFee(destination.id, "fagerstrand", edited), destination.id === "fagerstrand" ? 110 : 300);
  }
  assert.equal(routeDeliveryFee("fjellstrand", "tangen", edited), 150);
  assert.equal(routeDeliveryFee("tangen", "tangen", edited), 110);
});

test("multiple restaurants and duplicate items incur the highest route once", () => {
  const result = quoteDelivery([restaurant("A", "tangen"), restaurant("B", "fagerstrand"), restaurant("A", "tangen")], "tangen", "Testveien 1", prices);
  assert.equal(result.fee, 250);
  assert.equal(result.routes.length, 2);
  assert.equal(result.routes.map((route) => route.fee).join(","), "100,250");
});

test("unknown pickup/destination and custom-only orders never silently become a cheap fixed price", () => {
  assert.equal(routeDeliveryFee(null, "fagerstrand", prices), null);
  assert.equal(routeDeliveryFee("fagerstrand", null, prices), null);
  assert.equal(quoteDelivery([], "tangen", "Testveien 1", prices).fee, null);
  assert.equal(quoteDelivery([restaurant("A", "tangen"), restaurant("B", null)], "tangen", "Testveien 1", prices).fee, null);
});

test("quote identity changes when pricing, address, area or pickup changes", () => {
  const base = quoteDelivery([restaurant("A", "fagerstrand")], "tangen", "Testveien 1", prices).signature;
  for (const changed of [
    quoteDelivery([restaurant("A", "fagerstrand")], "tangen", "Testveien 1", { ...prices, revision: 1 }),
    quoteDelivery([restaurant("A", "fagerstrand")], "tangen", "Testveien 2", prices),
    quoteDelivery([restaurant("A", "fagerstrand")], "fagerstrand", "Testveien 1", prices),
    quoteDelivery([restaurant("A", "tangen")], "tangen", "Testveien 1", prices),
  ]) assert.notEqual(changed.signature, base);
  assert.equal(quoteDelivery([restaurant("A", "fagerstrand")], "tangen", "  TESTVEIEN   1 ", prices).signature, base);
});

test("invalid, partial or unsupported stored settings are rejected", () => {
  const valid = { ...prices, revision: 1 };
  assert.equal(parseDeliveryPricing(valid).areaFees.fagerstrand, 250);
  for (const value of [-1, 100.5, NaN, Infinity, "100", null, 10001]) {
    assert.throws(() => parseDeliveryPricing({ ...valid, sameAreaFee: value }));
    assert.throws(() => parseDeliveryPricing({ ...valid, areaFees: { ...valid.areaFees, tangen: value } }));
  }
  assert.throws(() => parseDeliveryPricing({ ...valid, revision: 0 }));
  assert.throws(() => parseDeliveryPricing({ ...valid, schemaVersion: 2 }));
  assert.throws(() => parseDeliveryPricing({ ...valid, areaFees: { tangen: 100 } }));
});

test("verified existing restaurants have areas; unknown names require admin selection", () => {
  assert.equal(restaurantDeliveryArea("Mama Greek Kitchen", undefined), "fagerstrand");
  assert.equal(restaurantDeliveryArea("Fagerstrand Grill", undefined), "fagerstrand");
  assert.equal(restaurantDeliveryArea("O' Sole Mio", undefined), "tangen");
  assert.equal(restaurantDeliveryArea("Ny restaurant", undefined), null);
  assert.equal(restaurantDeliveryArea("Mama Greek Kitchen", "fjellstrand"), "fjellstrand");
});
