import { useEffect, useState } from "react";
import { Alert, Linking, Text, TouchableOpacity, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAppTheme } from "../context/ThemeContext";
import { useWorkerLocation } from "../context/WorkerLocationContext";
import type { WorkerOrder } from "../services/workerService";

type Point = { latitude: number; longitude: number };
type Pickup = { name: string; address: string; coordinates: Point | null };
type RouteResult = { direct: number; via: (null | { toPickup: number; toCustomer: number })[] };
const point = (p: any): p is Point => p && Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
const minutes = (seconds: number) => `${Math.max(1, Math.round(seconds / 60))} min`;

export function WorkerOrderDetails({ order }: { order: WorkerOrder }) {
  const { colors } = useAppTheme(); const { position, message } = useWorkerLocation();
  const [pickups, setPickups] = useState<Pickup[]>([]); const [pickupError, setPickupError] = useState(""); const [route, setRoute] = useState<RouteResult | null>(null); const [routeMessage, setRouteMessage] = useState("");
  useEffect(() => { let alive = true; setPickups([]); setPickupError("");
    getDocs(collection(db, "restaurants")).then(snapshot => {
      const restaurants = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; name?: string; pickupAddress?: string; pickupCoordinates?: Point }));
      const distinct = new Map<string, Pickup>();
      for (const item of order.items ?? []) {
        const name = item.restaurantName?.trim(); if (!name) continue;
        const key = item.restaurantId || name.toLocaleLowerCase("nb-NO"); if (distinct.has(key)) continue;
        const matches = item.type === "custom" ? [] : item.restaurantId ? restaurants.filter(r => r.id === item.restaurantId) : restaurants.filter(r => r.name?.trim().toLocaleLowerCase("nb-NO") === name.toLocaleLowerCase("nb-NO"));
        const r = matches.length === 1 ? matches[0] : null;
        distinct.set(key, { name, address: r?.pickupAddress || "", coordinates: point(r?.pickupCoordinates) ? r!.pickupCoordinates! : null });
      }
      if (alive) setPickups([...distinct.values()]);
    }).catch(() => { if (alive) setPickupError("Kunne ikke hente henteadresser."); });
    return () => { alive = false; };
  }, [order.id]);
  useEffect(() => {
    let alive = true; let timer: ReturnType<typeof setTimeout> | undefined;
    const run = async () => {
      const endpoint = process.env.EXPO_PUBLIC_ROUTING_URL?.trim().replace(/\/$/, "");
      if (!endpoint) { setRoute(null); setRouteMessage("Kjøretid er ikke satt opp ennå."); return; }
      if (!position || Date.now() - position.timestamp > 120000) { setRoute(null); setRouteMessage(message); return; }
      if (!point(order.coordinates)) { setRoute(null); setRouteMessage("Kundens koordinater mangler, så kjøretid kan ikke beregnes."); return; }
      const valid = pickups.filter(p => p.coordinates); const points: Point[] = [position, order.coordinates, ...valid.map(p => p.coordinates!)];
      try {
        setRouteMessage("Beregner kjøretid …");
        const response = await fetch(`${endpoint}/table/v1/driving/${points.map(p => `${p.longitude},${p.latitude}`).join(";")}?annotations=duration`);
        if (!response.ok) throw new Error(); const json = await response.json(); const d = json.durations;
        if (json.code !== "Ok" || !Number.isFinite(d?.[0]?.[1])) throw new Error();
        let i = 2; const via = pickups.map(p => { if (!p.coordinates) return null; const index = i++; return Number.isFinite(d[0]?.[index]) && Number.isFinite(d[index]?.[1]) ? {toPickup:d[0][index],toCustomer:d[index][1]} : null; });
        if (alive) { setRoute({direct:d[0][1],via}); setRouteMessage(""); }
      } catch { if (alive) { setRoute(null); setRouteMessage("Kunne ikke beregne kjøretid. Prøv igjen senere."); } }
      if (alive) timer = setTimeout(run, 60000);
    };
    void run(); return () => { alive = false; if (timer) clearTimeout(timer); };
  }, [order.id, order.coordinates?.latitude, order.coordinates?.longitude, pickups, position ? Math.floor(position.timestamp / 60000) : 0]);
  const copy = async (value: string) => { try { await Clipboard.setStringAsync(value); Alert.alert("Kopiert", "Adressen er kopiert."); } catch { Alert.alert("Kunne ikke kopiere", "Prøv igjen."); } };
  const maps = (value: string) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`).catch(() => Alert.alert("Kunne ikke åpne kart"));
  const action = (label: string, callback: () => void) => <TouchableOpacity onPress={callback} style={{paddingVertical:7,marginRight:18}}><Text style={{color:colors.primary,fontWeight:"700"}}>{label}</Text></TouchableOpacity>;
  return <View style={{marginTop:12,borderTopWidth:1,borderColor:colors.border,paddingTop:12}}>
    <Text style={{color:colors.text,fontSize:17,fontWeight:"800"}}>Kunde: {order.customerName || "Ikke oppgitt"}</Text><Text style={{color:colors.textSecondary,marginTop:4}}>{order.address || "Adresse mangler"}</Text>
    {!!order.address && <View style={{flexDirection:"row"}}>{action("Kopier adresse", () => void copy(order.address))}{action("Åpne kart", () => maps(order.address))}</View>}
    {order.customerPhone && <Text style={{color:colors.textSecondary}}>Telefon: {order.customerPhone}</Text>}
    <Text style={{color:colors.text,fontWeight:"700",marginTop:10}}>Hentested</Text>{!!pickupError && <Text style={{color:colors.danger}}>{pickupError}</Text>}
    {pickups.length ? pickups.map((p,i) => <View key={`${p.name}-${i}`} style={{marginTop:8}}><Text style={{color:colors.text,fontWeight:"700"}}>{p.name}</Text><Text style={{color:colors.textSecondary}}>{p.address || "Henteadresse mangler"}</Text>{!!p.address && <View style={{flexDirection:"row"}}>{action("Kopier adresse", () => void copy(p.address))}{action("Åpne kart", () => maps(p.address))}</View>}{route?.via[i] && <Text style={{color:colors.text}}>Til hentested: {minutes(route.via[i]!.toPickup)} · Via hentested til kunde: {minutes(route.via[i]!.toPickup + route.via[i]!.toCustomer)}</Text>}</View>) : <Text style={{color:colors.textMuted}}>Ingen hentesteder oppgitt.</Text>}
    <Text style={{color:colors.text,fontWeight:"700",marginTop:12}}>Varer</Text>{(order.items ?? []).map((item,i) => <Text key={i} style={{color:colors.textSecondary,marginTop:3}}>{item.quantity} × {item.productName}{item.type !== "custom" && !item.customRequest ? ` · ${item.price} kr/stk` : " · pris avtales"}{item.customRequest ? ` — ${item.customRequest}` : ""}</Text>)}
    <Text style={{color:colors.text,marginTop:8}}>Kjente varepriser: {order.totalPrice} kr · Levering: {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text>
    {order.deliveryFee != null && <Text style={{color:colors.text,fontWeight:"700",marginTop:3}}>Sum kjente priser: {order.totalPrice + order.deliveryFee} kr</Text>}
    <Text style={{color:colors.text,fontWeight:"700",marginTop:12}}>Kjøretid</Text><Text style={{color:colors.textMuted,marginTop:4}}>Posisjon og leveringskoordinater sendes til rutetjenesten når du åpner oppdraget.</Text>{route ? <Text style={{color:colors.textSecondary}}>Direkte til kunde: {minutes(route.direct)}. Estimat uten live trafikk.</Text> : <Text style={{color:colors.textMuted}}>{routeMessage}</Text>}
    {pickups.length > 1 && <Text style={{color:colors.textMuted,marginTop:5}}>Tiden via hvert hentested er beregnet separat, ikke som en samlet rute.</Text>}
  </View>;
}
