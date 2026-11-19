export const deliveryAreas = [
  { id: "tangen", name: "Tangen / Hellvik" },
  { id: "bjornemyr", name: "Bjørnemyr" },
  { id: "alvaern", name: "Alværn / Fjordvangen" },
  { id: "fjellstrand", name: "Fjellstrand" },
  { id: "fagerstrand", name: "Fagerstrand" },
] as const;

export type DeliveryAreaId = typeof deliveryAreas[number]["id"];
export type DeliveryArea = typeof deliveryAreas[number];
export type DeliveryPricing = {
  schemaVersion: 1;
  sameAreaFee: number;
  areaFees: Record<DeliveryAreaId, number>;
  revision: number;
};

export const defaultDeliveryPricing: DeliveryPricing = {
  schemaVersion: 1,
  sameAreaFee: 100,
  areaFees: { tangen: 100, bjornemyr: 100, alvaern: 100, fjellstrand: 150, fagerstrand: 250 },
  revision: 0,
};

export function isDeliveryAreaId(value: unknown): value is DeliveryAreaId {
  return deliveryAreas.some((area) => area.id === value);
}

export function areaName(id: DeliveryAreaId | null | undefined): string {
  return deliveryAreas.find((area) => area.id === id)?.name ?? "Ukjent område";
}

export function validDeliveryFee(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 10000;
}

export function parseDeliveryPricing(data: unknown): DeliveryPricing {
  if (!data || typeof data !== "object") throw new Error("Leveringsprisene mangler.");
  const value = data as Record<string, any>;
  if (value.schemaVersion !== 1 || !validDeliveryFee(value.sameAreaFee) ||
      !Number.isSafeInteger(value.revision) || value.revision < 1 || !value.areaFees ||
      Object.keys(value.areaFees).length !== deliveryAreas.length ||
      deliveryAreas.some((area) => !validDeliveryFee(value.areaFees[area.id]))) {
    throw new Error("Leveringsprisene er ugyldige. Kontakt oss før du bestiller.");
  }
  return { schemaVersion: 1, sameAreaFee: value.sameAreaFee,
    areaFees: Object.fromEntries(deliveryAreas.map((area) => [area.id, value.areaFees[area.id]])) as DeliveryPricing["areaFees"],
    revision: value.revision };
}

const normalizedName = (name: string) => name.toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/ø/g, "o").replace(/æ/g, "ae").replace(/[^a-z0-9]/g, "");

// Verified locations on kjornesodden.no. Unknown restaurants require an admin-selected area.
const originalRestaurantAreas: Record<string, DeliveryAreaId> = {
  signalensjobad: "tangen", signalen: "tangen", tonyssushiogthai: "tangen",
  tonyssushithai: "tangen", jafsnesodden: "tangen", jafs: "tangen", jonathansushi: "tangen",
  flaskebekkbistro: "tangen", osolemio: "tangen", mamagreekkitchen: "fagerstrand",
  fagerstrandgrill: "fagerstrand",
};

export function restaurantDeliveryArea(name: string, savedArea: unknown): DeliveryAreaId | null {
  if (isDeliveryAreaId(savedArea)) return savedArea;
  return originalRestaurantAreas[normalizedName(name)] ?? null;
}

export type DeliveryRestaurant = { id: string; name: string; deliveryAreaId: DeliveryAreaId | null };
export type DeliveryRoute = {
  restaurantId: string;
  restaurantName: string;
  restaurantAreaId: DeliveryAreaId | null;
  fee: number | null;
  local: boolean;
};
export type DeliveryQuote = {
  fee: number | null;
  customerAreaId: DeliveryAreaId | null;
  address: string;
  revision: number;
  routes: DeliveryRoute[];
  signature: string;
};

export function routeDeliveryFee(
  restaurantAreaId: DeliveryAreaId | null,
  customerAreaId: DeliveryAreaId | null,
  pricing: DeliveryPricing
): number | null {
  if (!restaurantAreaId || !customerAreaId) return null;
  return restaurantAreaId === customerAreaId ? pricing.sameAreaFee
    : Math.max(pricing.areaFees[restaurantAreaId], pricing.areaFees[customerAreaId]);
}

export function quoteDelivery(
  restaurants: DeliveryRestaurant[], customerAreaId: DeliveryAreaId | null,
  address: string, pricing: DeliveryPricing
): DeliveryQuote {
  const unique = [...new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])).values()]
    .sort((a, b) => a.id.localeCompare(b.id));
  const routes = unique.map((restaurant) => ({
    restaurantId: restaurant.id, restaurantName: restaurant.name,
    restaurantAreaId: restaurant.deliveryAreaId,
    fee: routeDeliveryFee(restaurant.deliveryAreaId, customerAreaId, pricing),
    local: restaurant.deliveryAreaId !== null && restaurant.deliveryAreaId === customerAreaId,
  }));
  const fee = routes.length > 0 && routes.every((route) => route.fee !== null)
    ? Math.max(...routes.map((route) => route.fee!)) : null;
  const normalizedAddress = address.trim().replace(/\s+/g, " ").toLocaleLowerCase("nb-NO");
  return {
    fee, customerAreaId, address: normalizedAddress, revision: pricing.revision, routes,
    signature: JSON.stringify([pricing.revision, customerAreaId, normalizedAddress,
      routes.map((route) => [route.restaurantId, route.restaurantAreaId, route.fee]), fee]),
  };
}
