import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FeePanel from "../components/FeePanel";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { ORDER_STAGE_LABELS, type OrderStage } from "../services/customerOrders";
import { advanceDelivery, subscribeWorkerOrders, takeOrder, type WorkerOrder } from "../services/workerService";

export default function WorkerOrders() {
  const { user, role } = useAuth(); const { colors } = useAppTheme();
  const [available, setAvailable] = useState<WorkerOrder[]>([]); const [mine, setMine] = useState<WorkerOrder[]>([]); const [error, setError] = useState(""); const [busy, setBusy] = useState(""); const [orderIds, setOrderIds] = useState<string[]>([]);
  useEffect(() => {
    if (!user || role !== "worker") return;
    setError("");
    const a = subscribeWorkerOrders(user.uid, "available", setAvailable, e => setError(e.message));
    const b = subscribeWorkerOrders(user.uid, "mine", setMine, e => setError(e.message));
    AsyncStorage.getItem(`worker-order-${user.uid}`).then(value => { if (value) { try { setOrderIds(JSON.parse(value)); } catch {} } }).catch(() => {});
    return () => { a(); b(); };
  }, [user?.uid, role]);
  const active = useMemo(() => mine.filter(o => o.assignmentStatus === "assigned" && !["cancelled", "delivered"].includes(o.status)).sort((a, b) => {
    const ai = orderIds.indexOf(a.id), bi = orderIds.indexOf(b.id); return (ai < 0 ? 999999 : ai) - (bi < 0 ? 999999 : bi);
  }), [mine, orderIds]);
  const history = mine.filter(o => o.assignmentStatus === "completed" || ["cancelled", "delivered"].includes(o.status));
  const shift = (index: number, direction: number) => { const ids = active.map(o => o.id), target = index + direction; if (target < 0 || target >= ids.length) return; [ids[index], ids[target]] = [ids[target], ids[index]]; setOrderIds(ids); if (user) AsyncStorage.setItem(`worker-order-${user.uid}`, JSON.stringify(ids)).catch(() => {}); };
  const perform = async (id: string, action: () => Promise<void>) => { try { setBusy(id); await action(); } catch (e) { Alert.alert("Kunne ikke oppdatere oppdraget", e instanceof Error ? e.message : "Prøv igjen."); } finally { setBusy(""); } };
  const go = (destination: string) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`).catch(() => Alert.alert("Kunne ikke åpne kart"));
  const button = (label: string, action: () => void, disabled = false) => <TouchableOpacity disabled={disabled} onPress={action} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginTop: 8, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: colors.primary }}>{label}</Text></TouchableOpacity>;
  const card = (o: WorkerOrder, kind: "available" | "active" | "history", index: number) => {
    const pickups = [...new Set((o.items ?? []).map(i => i.restaurantName).filter(Boolean))];
    const next: Partial<Record<OrderStage, OrderStage>> = { ready: "picked_up", picked_up: "on_the_way", on_the_way: "delivered" }; const stage = next[o.status]; const blocked = o.deliveryFee == null || ["pending", "declined"].includes(o.feeProposal?.status ?? "");
    return <View key={o.id} style={{ borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 12, marginBottom: 12 }}>
      <Text style={{ color: colors.text, fontWeight: "700" }}>#{o.id.slice(-6)} · {ORDER_STAGE_LABELS[o.status]}</Text>
      <Text style={{ color: colors.text, marginTop: 6 }}>{o.customerName} · {o.address}</Text>
      {o.customerPhone && kind === "active" && button(`Ring kunden: ${o.customerPhone}`, () => Linking.openURL(`tel:${o.customerPhone}`))}
      {kind === "history" && o.completedAt && <Text style={{ color: colors.textMuted }}>Levert: {o.completedAt.toDate().toLocaleString("nb-NO")}</Text>}
      <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Henting: {pickups.join(", ") || "Ikke oppgitt"}</Text>
      {(o.items ?? []).map((item, i) => <Text key={i} style={{ color: colors.textSecondary }}>{item.quantity} × {item.productName}{item.customRequest ? ` — ${item.customRequest}` : ""}</Text>)}
      <Text style={{ color: colors.textSecondary }}>Varer: {o.totalPrice} kr · Levering: {o.deliveryFee == null ? "avtales" : `${o.deliveryFee} kr`}</Text>
      {kind === "active" && <FeePanel orderId={o.id} fee={o.deliveryFee} proposal={o.feeProposal} canPropose={! ["picked_up", "on_the_way", "delivered", "cancelled"].includes(o.status)} isCustomer={false} />}
      {kind === "available" && button("Ta oppdrag", () => perform(o.id, () => takeOrder(o.id)), !!busy)}
      {kind === "active" && <>{button("Naviger til kunden", () => go(o.coordinates ? `${o.coordinates.latitude},${o.coordinates.longitude}` : o.address))}{pickups.map(p => <View key={p}>{button(`Finn ${p} i kart`, () => go(`${p}, Nesodden`))}</View>)}
        {button("Flytt opp", () => shift(index, -1), index === 0)}{button("Flytt ned", () => shift(index, 1), index === active.length - 1)}
        {blocked && <Text style={{color:colors.danger,marginTop:8}}>Leveringsprisen må godkjennes før henting.</Text>}
        {stage ? button(ORDER_STAGE_LABELS[stage], () => stage === "delivered" ? Alert.alert("Bekreft levering", "Er bestillingen levert?", [{ text: "Avbryt", style: "cancel" }, { text: "Levert", onPress: () => perform(o.id, () => advanceDelivery(o.id, stage)) }]) : perform(o.id, () => advanceDelivery(o.id, stage)), !!busy || blocked) : <Text style={{ color: colors.textMuted, marginTop: 8 }}>Venter på at bestillingen er klar for henting.</Text>}
      </>}
    </View>;
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}><Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Sjåføroppdrag</Text>
    {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente oppdrag: {error}</Text>}
    {[{ title: "Mine aktive oppdrag", list: active, kind: "active" as const }, { title: "Ledige oppdrag", list: available.filter(o => !["cancelled", "delivered"].includes(o.status)), kind: "available" as const }, { title: "Historikk", list: history, kind: "history" as const }].map(section => <View key={section.title}><Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginVertical: 14 }}>{section.title}</Text>{section.list.length ? section.list.map((o, i) => card(o, section.kind, i)) : <Text style={{ color: colors.textMuted }}>Ingen oppdrag.</Text>}</View>)}
  </ScrollView></SafeAreaView>;
}
