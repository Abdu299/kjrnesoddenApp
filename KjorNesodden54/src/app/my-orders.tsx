import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import FeePanel from "../components/FeePanel";
import { makeLegacyOrderAvailable, releaseAssignedOrder } from "../services/workerService";
import { ORDER_STAGES, ORDER_STAGE_LABELS, subscribeOrders, updateOrderStage, type CustomerOrder, type OrderStage } from "../services/customerOrders";

export default function MyOrders() {
  const { user, role } = useAuth();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { colors } = useAppTheme();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const admin = role === "admin";
  useEffect(() => {
    if (!user || (role !== "customer" && role !== "admin")) { setLoading(false); return; }
    setLoading(true); setError("");
    return subscribeOrders(admin, value => { setOrders(value); setLoading(false); }, e => { setError(e.message); setLoading(false); });
  }, [user?.uid, role, admin]);
  const setStage = async (id: string, stage: OrderStage) => {
    try { setSaving(id); await updateOrderStage(id, stage); }
    catch { Alert.alert("Kunne ikke oppdatere", "Prøv igjen."); }
    finally { setSaving(""); }
  };
  const visibleOrders = orderId ? orders.filter(o => o.id === orderId) : orders;
  const sections = [{ title: "Aktive bestillinger", data: visibleOrders.filter(o => o.status !== "delivered" && o.status !== "cancelled") },
    { title: "Tidligere bestillinger", data: visibleOrders.filter(o => o.status === "delivered" || o.status === "cancelled") }];
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 12 }}>{admin ? "Kundebestillinger" : "Mine bestillinger"}</Text>
    {orderId && <Text onPress={() => router.setParams({orderId: ""})} style={{color:colors.primary,marginBottom:12}}>Vis alle bestillinger</Text>}
    {!user && <Text style={{ color: colors.text }}>Logg inn for å se bestillingene dine.</Text>}
    {loading && <ActivityIndicator color={colors.primary} />}
    {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente bestillingene: {error}</Text>}
    {!loading && !error && user && sections.map(section => <View key={section.title}>
      <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginVertical: 14 }}>{section.title}</Text>
      {section.data.length === 0 && <Text style={{ color: colors.textMuted }}>Ingen bestillinger her.</Text>}
      {section.data.map(order => <View key={order.id} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12, backgroundColor: colors.surface }}>
        <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 17 }}>{ORDER_STAGE_LABELS[order.status] ?? "Ukjent status"}</Text>
        <Text style={{ color: colors.textMuted, marginTop: 5 }}>{order.createdAt?.toDate?.().toLocaleString("nb-NO") ?? "Registreres…"} · #{order.id.slice(-6)}</Text>
        {admin && <Text style={{ color: colors.text, marginTop: 8 }}>{order.customerName}</Text>}
        <Text style={{ color: colors.text, marginTop: 8 }}>Levering: {order.address}</Text>
        {admin && order.coordinates && <Text onPress={() => Linking.openURL(`https://www.google.com/maps?q=${order.coordinates!.latitude},${order.coordinates!.longitude}`)} style={{ color: colors.primary, marginTop: 8 }}>Åpne leveringspunkt i kart</Text>}
        {order.items?.map((item, index) => <Text key={index} style={{ color: colors.text, marginTop: 4 }}>{item.quantity} × {item.productName} · {item.restaurantName}{item.customRequest ? `\n${item.customRequest}` : ""}</Text>)}
        <Text style={{ color: colors.text, marginTop: 8 }}>Varer: {order.totalPrice} kr · Levering: {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text>
        <FeePanel orderId={order.id} fee={order.deliveryFee} proposal={order.feeProposal} canPropose={admin && !["picked_up", "on_the_way", "delivered", "cancelled"].includes(order.status)} isCustomer={!admin} />
        {admin && order.assignmentStatus === "assigned" && ["placed", "confirmed", "preparing", "ready"].includes(order.status) && <TouchableOpacity disabled={!!saving} onPress={() => Alert.alert("Frigi oppdrag", "Oppdraget blir tilgjengelig for andre sjåfører.", [{ text: "Avbryt", style: "cancel" }, { text: "Frigi", onPress: async () => { try { setSaving(order.id); await releaseAssignedOrder(order.id); } catch (e) { Alert.alert("Kunne ikke frigi oppdrag", e instanceof Error ? e.message : "Prøv igjen."); } finally { setSaving(""); } } }])}><Text style={{ color: colors.primary, marginTop: 12 }}>Frigi oppdrag fra sjåfør</Text></TouchableOpacity>}
        {admin && !order.assignmentStatus && !["delivered", "cancelled"].includes(order.status) && <TouchableOpacity disabled={!!saving} onPress={async () => { try { setSaving(order.id); await makeLegacyOrderAvailable(order.id); } catch (e) { Alert.alert("Kunne ikke legge ut oppdrag", e instanceof Error ? e.message : "Prøv igjen."); } finally { setSaving(""); } }}><Text style={{ color: colors.primary, marginTop: 12 }}>Gjør eldre bestilling tilgjengelig for sjåfører</Text></TouchableOpacity>}
        {admin && <View style={{ marginTop: 12 }}><Text style={{ color: colors.textSecondary }}>Oppdater status:</Text><View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {ORDER_STAGES.map(stage => <TouchableOpacity key={stage} disabled={!!saving || order.status === stage} onPress={() => setStage(order.id, stage)} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 8, marginRight: 6, marginTop: 6, opacity: order.status === stage ? 0.5 : 1 }}><Text style={{ color: colors.primary }}>{ORDER_STAGE_LABELS[stage]}</Text></TouchableOpacity>)}
        </View></View>}
      </View>)}
    </View>)}
  </ScrollView></SafeAreaView>;
}
