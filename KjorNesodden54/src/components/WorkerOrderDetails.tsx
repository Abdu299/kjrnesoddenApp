import { useEffect, useRef, useState, type ReactNode } from "react";
import { Alert, Linking, Pressable, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAppTheme } from "../context/ThemeContext";
import { useWorkerLocation } from "../context/WorkerLocationContext";
import { resolveNesoddenAddress } from "../services/addressService";
import { drivingLegs, geoapifyKey, hasDrivingProvider, isDrivingPoint, type DrivingLeg, type DrivingPoint } from "../services/workerDriving";
import type { WorkerOrder } from "../services/workerService";

type RestaurantPickup = { id: string; name?: string; pickupAddress?: string; pickupCoordinates?: DrivingPoint };
type PickupEstimate = { toPickup: DrivingLeg; total: DrivingLeg | null };

const minutes = (seconds: number) => seconds < 60 ? "< 1 min" : `${Math.round(seconds / 60)} min`;
const km = (meters: number) => `${(meters / 1000).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} km`;
const coordinatesText = (point: DrivingPoint) => `${point.latitude},${point.longitude}`;

export function WorkerOrderDetails({ order, canCall, showEstimate }: { order: WorkerOrder; canCall: boolean; showEstimate: boolean }) {
  const { colors } = useAppTheme();
  const { position, message } = useWorkerLocation();
  const positionRef = useRef(position);
  positionRef.current = position;

  const [restaurants, setRestaurants] = useState<RestaurantPickup[] | null>(null);
  const [pickupError, setPickupError] = useState(false);
  const [resolved, setResolved] = useState<{ address: string; point: DrivingPoint | null }>();
  const [direct, setDirect] = useState<DrivingLeg | null>(null);
  const [via, setVia] = useState<Record<string, PickupEstimate | null>>({});
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [retry, setRetry] = useState(0);
  const hasPosition = !!position;

  useEffect(() => onSnapshot(query(collection(db, "restaurants"), where("active", "==", true)), snapshot => {
    setPickupError(false);
    setRestaurants(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as RestaurantPickup)));
  }, () => { setRestaurants(null); setPickupError(true); }), []);

  const customerPoint = isDrivingPoint(order.coordinates) ? order.coordinates
    : resolved?.address === order.address ? resolved.point : null;
  useEffect(() => {
    if (!showEstimate || isDrivingPoint(order.coordinates) || !order.address) return;
    let active = true;
    void resolveNesoddenAddress(order.address).then(point => {
      if (active) setResolved({ address: order.address, point });
    });
    return () => { active = false; };
  }, [order.address, order.coordinates?.latitude, order.coordinates?.longitude, showEstimate, retry]);

  const pickups = [...new Map((order.items ?? []).filter(item => item.restaurantName?.trim()).map(item => {
    const name = item.restaurantName.trim();
    const normalized = name.toLocaleLowerCase("nb-NO");
    const key = item.type === "custom" ? `custom:${normalized}` : item.restaurantId || normalized;
    const matches = item.type === "custom" ? [] : (restaurants ?? []).filter(restaurant =>
      item.restaurantId ? restaurant.id === item.restaurantId : restaurant.name?.trim().toLocaleLowerCase("nb-NO") === normalized);
    const pickup = matches.length === 1 ? matches[0] : undefined;
    return [key, { key, name, address: pickup?.pickupAddress, point: pickup?.pickupCoordinates }] as const;
  })).values()];
  const pickupPointsKey = JSON.stringify(pickups.flatMap(({ key, point }) => isDrivingPoint(point) ? [{ key, point }] : []));

  useEffect(() => {
    setDirect(null);
    setVia({});
    setLoadingRoute(false);
    if (!showEstimate || !hasPosition || !hasDrivingProvider) return;
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const pickupPoints = JSON.parse(pickupPointsKey) as { key: string; point: DrivingPoint }[];
    let lastOrigin = "";
    const calculate = async () => {
      const origin = positionRef.current;
      if (!isDrivingPoint(origin) || controller.signal.aborted) return;
      const fingerprint = `${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}`;
      if (fingerprint === lastOrigin) return;
      lastOrigin = fingerprint;
      setLoadingRoute(true);
      const request = new AbortController();
      const cancel = () => request.abort();
      controller.signal.addEventListener("abort", cancel);
      const deadline = setTimeout(cancel, 12000);

      try {
        if (customerPoint) {
          const leg = await drivingLegs([origin, customerPoint], request.signal).then(legs => legs[0], () => null);
          if (!controller.signal.aborted) setDirect(leg);
        }
        const estimates: Record<string, PickupEstimate | null> = {};
        for (const { key, point } of pickupPoints) {
          if (request.signal.aborted) break;
          const legs = await drivingLegs(customerPoint ? [origin, point, customerPoint] : [origin, point], request.signal).catch(() => null);
          if (!legs) { estimates[key] = null; continue; }
          const [toPickup, toCustomer] = legs;
          estimates[key] = {
            toPickup,
            total: toCustomer ? { seconds: toPickup.seconds + toCustomer.seconds, meters: toPickup.meters + toCustomer.meters } : null,
          };
        }
        if (!controller.signal.aborted) setVia(estimates);
      } finally {
        clearTimeout(deadline);
        controller.signal.removeEventListener("abort", cancel);
        if (!controller.signal.aborted) setLoadingRoute(false);
      }
    };
    const refresh = async () => {
      await calculate();
      if (!controller.signal.aborted) timeout = setTimeout(refresh, 60000);
    };
    void refresh();
    return () => { controller.abort(); clearTimeout(timeout); };
  }, [showEstimate, hasPosition, customerPoint?.latitude, customerPoint?.longitude, pickupPointsKey, retry]);

  const open = (url: string) => void Linking.openURL(url).catch(() => Alert.alert("Kunne ikke åpne lenken"));
  const copy = (address: string) => void Clipboard.setStringAsync(address).then(ok => {
    Alert.alert(ok ? "Adresse kopiert" : "Kunne ikke kopiere adressen");
  }).catch(() => Alert.alert("Kunne ikke kopiere adressen"));
  const maps = (destination: string) => open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(destination)}`);
  const action = (label: string, onPress: () => void) => <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 8 }}>
    <Text style={{ color: colors.primary, fontWeight: "700" }}>{label}</Text>
  </Pressable>;
  const section = (title: string, children: ReactNode, highlight = false) => <View style={{
    borderRadius: 14, borderWidth: 1, borderColor: highlight ? colors.primaryBorder : colors.border,
    backgroundColor: highlight ? colors.primarySoft : colors.surface, padding: 16, gap: 8,
  }}>
    <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{title}</Text>
    {children}
  </View>;
  const description = (value: string) => <Text style={{ color: colors.textSecondary }}>{value}</Text>;
  const destination = customerPoint ? coordinatesText(customerPoint) : order.address;

  return <>
    {showEstimate && section("Direkte til kunden med bil", <>
      {direct && hasPosition ? <>
        <Text style={{ color: colors.primary, fontSize: 32, fontWeight: "800" }}>{minutes(direct.seconds)}</Text>
        {description(`${km(direct.meters)} · Fra din posisjon. Estimat uten sanntidstrafikk.`)}
      </> : description(!hasPosition ? message
        : !hasDrivingProvider ? "Åpne ruten i kart for å se beregnet kjøretid."
        : !customerPoint ? "Venter på et gyldig leveringspunkt."
        : loadingRoute ? "Beregner kjøretid …" : "Kjøretiden er utilgjengelig akkurat nå.")}
      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        {!!destination && action("Se bilrute i kart", () => maps(destination))}
        {hasDrivingProvider && hasPosition && !loadingRoute && action("Oppdater kjøretid", () => setRetry(value => value + 1))}
      </View>
      {geoapifyKey && hasPosition && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Text accessibilityRole="link" onPress={() => open("https://www.geoapify.com/")} style={{ color: colors.textMuted, fontSize: 12 }}>Powered by Geoapify</Text>
        <Text accessibilityRole="link" onPress={() => open("https://www.openstreetmap.org/copyright")} style={{ color: colors.textMuted, fontSize: 12 }}>© OpenStreetMap contributors</Text>
      </View>}
    </>, true)}
    {section("Leveringsadresse", <>
      {description(order.address || "Adresse mangler")}
      <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
        {!!order.address && action("Kopier adresse", () => copy(order.address))}
        {!!destination && action("Åpne i kartet", () => maps(destination))}
        {canCall && !!order.customerPhone && action("Ring kunden", () => open(`tel:${order.customerPhone}`))}
      </View>
    </>)}
    {section("Hentested", <>
      {pickupError && description("Kunne ikke hente henteadressene.")}
      {!pickups.length && description("Ingen hentesteder oppgitt.")}
      {pickups.map(pickup => {
        const estimate = hasPosition ? via[pickup.key] : null;
        return <View key={pickup.key} style={{ paddingBottom: 4, gap: 4 }}>
          <Text style={{ color: colors.text, fontWeight: "700" }}>{pickup.name}</Text>
          {description(pickup.address || (restaurants || pickupError ? "Henteadresse mangler" : "Henter adresse …"))}
          {estimate && description(`Fra deg til hentested: ${minutes(estimate.toPickup.seconds)}`)}
          {estimate?.total && <Text style={{ color: colors.primary, fontWeight: "700" }}>Via hentested til kunde: {minutes(estimate.total.seconds)}</Text>}
          <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
            {!!pickup.address && action("Kopier adresse", () => copy(pickup.address!))}
            {action("Åpne i kart", () => maps(isDrivingPoint(pickup.point) ? coordinatesText(pickup.point) : pickup.address || `${pickup.name}, Nesodden`))}
          </View>
        </View>;
      })}
      {pickups.length > 1 && Object.values(via).some(estimate => estimate?.total) && description("Tidene via hvert hentested er beregnet separat.")}
    </>)}
    {section("Varer og pris", <>
      {(order.items ?? []).map((item, index) => <View key={index} style={{ gap: 2 }}>
        <Text style={{ color: colors.text }}>{item.quantity} × {item.productName}{item.type === "custom" || item.customRequest ? " · pris avtales" : ` · ${item.price} kr/stk`}</Text>
        {!!item.customRequest && description(item.customRequest)}
      </View>)}
      {description(`Kjente varepriser: ${order.totalPrice} kr`)}
      {description(`Levering: ${order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}`)}
      {order.deliveryFee != null && <Text style={{ color: colors.text, fontWeight: "800" }}>Sum kjente priser: {order.totalPrice + order.deliveryFee} kr</Text>}
    </>)}
  </>;
}
