export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
};

export type AddressSuggestion = {
  id: string;
  streetAddress: string;
  postalCode: string;
  postalPlace: string;
  label: string;
  zone: DeliveryZone;
};

const NESODDEN_MUNICIPALITY = "3212";
const ADDRESS_API = "https://ws.geonorge.no/adresser/v1/sok";

const zones: DeliveryZone[] = [
  { id: "tangen", name: "Tangen / Hellvik", fee: 75 },
  { id: "bjornemyr", name: "Bjørnemyr", fee: 100 },
  { id: "alvaern", name: "Alværn / Fjordvangen / Fjellstrand", fee: 100 },
  { id: "fagerstrand", name: "Fagerstrand", fee: 150 },
];

const anchors: [number, number, string][] = [
  [59.8588, 10.6634, "tangen"], [59.8604, 10.6542, "tangen"],
  [59.8614, 10.6718, "tangen"], [59.8507, 10.6777, "tangen"],
  [59.857, 10.6608, "tangen"], [59.8343, 10.6418, "bjornemyr"],
  [59.8274, 10.6355, "bjornemyr"], [59.8445, 10.6912, "tangen"],
  [59.8416, 10.6738, "tangen"], [59.8209, 10.6278, "alvaern"],
  [59.8292, 10.6952, "alvaern"], [59.8331, 10.6941, "alvaern"],
  [59.7952, 10.6083, "alvaern"], [59.8064, 10.6256, "alvaern"],
  [59.814, 10.6768, "alvaern"], [59.7912, 10.7054, "alvaern"],
  [59.7773, 10.6907, "alvaern"], [59.7779, 10.7059, "alvaern"],
  [59.7375, 10.594, "fagerstrand"], [59.743, 10.6127, "fagerstrand"],
  [59.7505, 10.6082, "fagerstrand"], [59.7604, 10.5842, "fagerstrand"],
  [59.7116, 10.6244, "fagerstrand"],
];

function deliveryZone(
  latitude: number,
  longitude: number,
  postalCode: string,
  postalPlace: string
) {
  if (
    postalCode === "1453" ||
    postalPlace.toLocaleUpperCase("nb-NO") === "BJØRNEMYR"
  ) {
    return zones.find((zone) => zone.id === "bjornemyr")!;
  }

  let closestId = "";
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [lat, lon, zoneId] of anchors) {
    const dy = latitude - lat;
    const dx =
      (longitude - lon) * Math.cos((latitude * Math.PI) / 180);
    const distance = dy * dy + dx * dx;

    if (distance < closestDistance) {
      closestDistance = distance;
      closestId = zoneId;
    }
  }

  return zones.find((zone) => zone.id === closestId)!;
}

export async function searchNesoddenAddresses(
  query: string,
  signal?: AbortSignal
): Promise<AddressSuggestion[]> {
  const cleanQuery = query.trim().replace(/\s+/g, " ");

  if (cleanQuery.length < 3) {
    return [];
  }

  const wildcardQuery = cleanQuery
    .split(" ")
    .map((word) => (/^\d/.test(word) || word.endsWith("*") ? word : `${word}*`))
    .join(" ");

  const params = new URLSearchParams({
    kommunenummer: NESODDEN_MUNICIPALITY,
    sok: wildcardQuery,
    treffPerSide: "8",
    utkoordsys: "4258",
  });

  const response = await fetch(`${ADDRESS_API}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error("Adresseoppslaget er midlertidig utilgjengelig.");
  }

  const result = await response.json();
  const addresses = Array.isArray(result.adresser) ? result.adresser : [];

  return addresses
    .map((raw: any): AddressSuggestion | null => {
      if (String(raw.kommunenummer) !== NESODDEN_MUNICIPALITY || !raw.nummer) {
        return null;
      }

      const latitude = Number(raw.representasjonspunkt?.lat);
      const longitude = Number(raw.representasjonspunkt?.lon);
      const streetAddress =
        raw.adressetekstutenadressetilleggsnavn || raw.adressetekst;

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !streetAddress ||
        !raw.postnummer ||
        !raw.poststed
      ) {
        return null;
      }

      const zone = deliveryZone(
        latitude,
        longitude,
        String(raw.postnummer),
        String(raw.poststed)
      );

      return {
        id: `${raw.kommunenummer}:${raw.adressekode}:${raw.nummer}:${raw.bokstav || ""}`,
        streetAddress,
        postalCode: String(raw.postnummer),
        postalPlace: String(raw.poststed),
        label: `${streetAddress}, ${raw.postnummer} ${raw.poststed}`,
        zone,
      };
    })
    .filter((address: AddressSuggestion | null): address is AddressSuggestion => Boolean(address));
}
