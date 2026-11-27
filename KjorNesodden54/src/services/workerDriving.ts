export type DrivingPoint = { latitude: number; longitude: number };
export type DrivingLeg = { seconds: number; meters: number };

export function isDrivingPoint(value: DrivingPoint | null | undefined): value is DrivingPoint {
  return !!value && Number.isFinite(value.latitude) && Math.abs(value.latitude) <= 90 &&
    Number.isFinite(value.longitude) && Math.abs(value.longitude) <= 180;
}

export const geoapifyKey = process.env.EXPO_PUBLIC_GEOAPIFY_ROUTING_KEY?.trim();
const osrmUrl = process.env.EXPO_PUBLIC_ROUTING_URL?.trim().replace(/\/$/, "");
export const hasDrivingProvider = !!(geoapifyKey || osrmUrl);

export async function drivingLegs(points: DrivingPoint[], signal: AbortSignal): Promise<DrivingLeg[]> {
  const coordinates = points.map(({ latitude, longitude }) => `${latitude},${longitude}`).join("|");
  const osrmCoordinates = points.map(({ latitude, longitude }) => `${longitude},${latitude}`).join(";");
  const url = geoapifyKey
    ? `https://api.geoapify.com/v1/routing?mode=drive&waypoints=${encodeURIComponent(coordinates)}&apiKey=${encodeURIComponent(geoapifyKey)}`
    : `${osrmUrl}/route/v1/driving/${osrmCoordinates}?overview=false&steps=false`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Rutetjenesten er utilgjengelig.");
  const result = await response.json();
  const legs = geoapifyKey ? result.features?.[0]?.properties?.legs : result.routes?.[0]?.legs;
  if (!Array.isArray(legs) || legs.length !== points.length - 1) throw new Error("Fant ingen kjørerute.");
  return legs.map(leg => {
    const seconds = geoapifyKey ? leg.time : leg.duration;
    if (!Number.isFinite(seconds) || seconds < 0 || !Number.isFinite(leg.distance) || leg.distance < 0) {
      throw new Error("Fant ingen kjørerute.");
    }
    return { seconds, meters: leg.distance };
  });
}
