import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import FeePanel from "../components/FeePanel";
import { ORDER_STAGE_LABELS, subscribeOrders, type CustomerOrder } from "../services/customerOrders";
import AdminOrders from "../components/AdminOrders";

export default function MyOrders() {
  const { role } = useAuth();
  return role === "admin" ? <AdminOrders /> : <CustomerOrders />;
}

function CustomerOrders() {
  const { user, role } = useAuth();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const { colors } = useAppTheme();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useEffect(() => {
    if (!user || role !== "customer") { setLoading(false); return; }
    setLoading(true); setError("");
    return subscribeOrders(false, value => { setOrders(value); setLoading(false); }, e => { setError(e.message); setLoading(false); });
  }, [user?.uid, role]);
  const visibleOrders = orderId ? orders.filter(o => o.id === orderId) : orders;
  const sections = [{ title: "Aktive bestillinger", data: visibleOrders.filter(o => o.status !== "delivered" && o.status !== "cancelled") },
    { title: "Tidligere bestillinger", data: visibleOrders.filter(o => o.status === "delivered" || o.status === "cancelled") }];
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 12 }}>Mine bestillinger</Text>
    {orderId && <Text onPress={() => router.setParams({orderId: ""})} style={{color:colors.primary,marginBottom:12}}>Vis alle bestillinger</Text>}
    {!user && <Text style={{ color: colors.text }}>Logg inn for å se bestillingene dine.</Text>}
    {loading && <ActivityIndicator color={colors.primary} />}
    {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente bestillingene: {error}</Text>}
    {!loading && !error && user && sections.map(section => <View key={section.title}>
      <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginVertical: 14 }}>{section.title}</Text>
      {section.data.length === 0 && <Text style={{ color: colors.textMuted }}>Ingen bestillinger her.</Text>}
      {section.data.map(order => <View key={order.id} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, marginBottom: 12, backgroundColor: colors.surface }}>
        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: orderId === order.id || expandedId === order.id }} onPress={() => { if (orderId) router.setParams({orderId: ""}); setExpandedId(expandedId === order.id && !orderId ? null : order.id); }}>
          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 17 }}>{ORDER_STAGE_LABELS[order.status] ?? "Ukjent status"}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 5 }}>{order.createdAt?.toDate?.().toLocaleString("nb-NO") ?? "Registreres…"} · #{order.id.slice(-6)} · Trykk for detaljer</Text>
        </TouchableOpacity>
        {(orderId === order.id || expandedId === order.id) && <>
        <Text style={{ color: colors.text, marginTop: 8 }}>Levering: {order.address}</Text>
        {order.items?.map((item, index) => <Text key={index} style={{ color: colors.text, marginTop: 4 }}>{item.quantity} × {item.productName} · {item.restaurantName}{item.customRequest ? `\n${item.customRequest}` : ""}</Text>)}
        <Text style={{ color: colors.text, marginTop: 8 }}>Varer: {order.totalPrice} kr · Levering: {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text>
        <FeePanel orderId={order.id} fee={order.deliveryFee} proposal={order.feeProposal} canPropose={false} isCustomer />
        </>}
      </View>)}
    </View>)}
  </ScrollView></SafeAreaView>;
}
