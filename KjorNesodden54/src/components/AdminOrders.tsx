import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import AdminPage from "./AdminPage";
import FeePanel from "./FeePanel";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { cancelCustomerRequest } from "../services/adminRequestService";
import {
  ORDER_STAGES,
  ORDER_STAGE_LABELS,
  subscribeOrders,
  updateOrderStage,
  type CustomerOrder,
  type OrderStage,
} from "../services/customerOrders";
import { makeLegacyOrderAvailable, releaseAssignedOrder } from "../services/workerService";

const nextAction: Partial<Record<OrderStage, string>> = {
  confirmed: "Bekreft bestilling",
  preparing: "Start tilberedning",
  ready: "Merk klar for henting",
  picked_up: "Merk som hentet",
  on_the_way: "Merk som på vei",
  delivered: "Merk som levert",
};
const money = new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 2 });
const isClosed = (order: CustomerOrder) => order.status === "delivered" || order.status === "cancelled";

export default function AdminOrders({ history = false }: { history?: boolean }) {
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!user || role !== "admin") return;
    setLoading(true);
    setOrders([]);
    setError("");
    return subscribeOrders(true, value => {
      setOrders(value);
      setError("");
      setLoading(false);
    }, error => {
      setError(error.message);
      setLoading(false);
    });
  }, [user?.uid, role]);

  const change = async (id: string, action: () => Promise<void>) => {
    setBusy(id);
    try {
      await action();
    } catch (error) {
      Alert.alert("Kunne ikke oppdatere bestillingen", error instanceof Error ? error.message : "Prøv igjen.");
    } finally {
      setBusy("");
    }
  };

  const ask = (title: string, description: string, label: string, action: () => void, destructive = false) =>
    Alert.alert(title, description, [
      { text: "Avbryt", style: "cancel" },
      { text: label, style: destructive ? "destructive" : "default", onPress: action },
    ]);

  const visible = orders.filter(order => isClosed(order) === history);
  return <AdminPage title={history ? "Bestillingshistorikk" : "Bestillinger"} backTo={history ? "/my-orders" : undefined}>
    {!history && <Pressable accessibilityRole="button" onPress={() => router.push("/admin-order-history")} style={[styles.button, { backgroundColor: colors.surfaceMuted }]}>
      <Text style={[styles.buttonText, { color: colors.primary }]}>Vis historikk ›</Text>
    </Pressable>}
    <Text style={[styles.section, { color: colors.text }]}>
      {history ? "Leverte og kansellerte" : "Aktive bestillinger"}{!loading && !error ? ` · ${visible.length}` : ""}
    </Text>
    {loading && <ActivityIndicator color={colors.primary} />}
    {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente bestillinger: {error}</Text>}
    {!loading && !error && visible.length === 0 && <Text style={{ color: colors.textMuted }}>
      {history ? "Ingen tidligere bestillinger." : "Ingen aktive bestillinger."}
    </Text>}
    {!loading && !error && visible.map(order => {
      const stageIndex = ORDER_STAGES.indexOf(order.status);
      const next = stageIndex >= 0 && nextAction[ORDER_STAGES[stageIndex + 1]] ? ORDER_STAGES[stageIndex + 1] : undefined;
      const open = expanded === order.id;
      const restaurants = [...new Set((order.items ?? []).map(item => item.restaurantName).filter(Boolean))];
      const canRelease = order.assignmentStatus === "assigned" && stageIndex >= 0 && stageIndex < ORDER_STAGES.indexOf("picked_up");
      const statusColor = order.status === "cancelled" ? colors.danger : order.status === "delivered" ? colors.success : colors.primary;
      const statusBackground = order.status === "cancelled" ? colors.dangerSoft : order.status === "delivered" ? colors.successSoft : colors.primarySoft;
      return <View key={order.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? null : order.id)} style={styles.summary}>
          <View style={styles.summaryTop}>
            <Text style={[styles.customer, { color: colors.text }]}>{order.customerName || "Kunde"}</Text>
            <Text style={[styles.badge, { color: statusColor, backgroundColor: statusBackground }]}>{ORDER_STAGE_LABELS[order.status] ?? "Ukjent status"}</Text>
          </View>
          {!!restaurants.length && <Text style={{ color: colors.textSecondary }}>{restaurants.join(", ")}</Text>}
          {!!order.address && <Text style={{ color: colors.textSecondary }}>{order.address}</Text>}
          <Text style={{ color: colors.textMuted }}>
            #{order.id.slice(-6)} · {order.createdAt?.toDate?.().toLocaleString("nb-NO", { timeZone: "Europe/Oslo", dateStyle: "short", timeStyle: "short" }) ?? "Registreres…"}
          </Text>
          <Text style={[styles.buttonText, { color: colors.primary }]}>{open ? "Skjul detaljer" : "Vis detaljer ›"}</Text>
        </Pressable>

        {open && <View style={[styles.details, { borderColor: colors.divider }]}>
          {order.customerPhone && <Text style={{ color: colors.textSecondary }}>Telefon: {order.customerPhone}</Text>}
          {order.coordinates && <Pressable accessibilityRole="link" onPress={() => {
            const { latitude, longitude } = order.coordinates!;
            void Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`).catch(() => Alert.alert("Kunne ikke åpne kart"));
          }}><Text style={{ color: colors.primary }}>Åpne leveringspunkt i kart</Text></Pressable>}
          {(order.items ?? []).map((item, index) => <Text key={index} style={{ color: colors.text }}>
            {item.quantity} × {item.productName} · {item.restaurantName}{item.customRequest ? `\n${item.customRequest}` : ""}
          </Text>)}
          <Text style={{ color: colors.textSecondary }}>Varer: {money.format(order.totalPrice)} · Levering: {order.deliveryFee == null ? "avtales" : money.format(order.deliveryFee)}</Text>
          <FeePanel orderId={order.id} fee={order.deliveryFee} proposal={order.feeProposal} canPropose={!history && stageIndex >= 0 && stageIndex < ORDER_STAGES.indexOf("picked_up")} isCustomer={false} />
          {!history && canRelease && <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => ask("Frigi oppdrag?", "Oppdraget blir tilgjengelig for andre sjåfører.", "Frigi", () => void change(order.id, () => releaseAssignedOrder(order.id)))}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>Frigi oppdrag</Text>
          </Pressable>}
          {!history && !order.assignmentStatus && <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => void change(order.id, () => makeLegacyOrderAvailable(order.id))}>
            <Text style={[styles.buttonText, { color: colors.primary }]}>Gjør tilgjengelig for sjåfører</Text>
          </Pressable>}
          {!history && <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => ask("Kanseller bestilling?", "Kunden varsles, og bestillingen flyttes til historikken.", "Kanseller bestilling", () => void change(order.id, () => cancelCustomerRequest(order.id)), true)}>
            <Text style={[styles.buttonText, { color: colors.danger }]}>Kanseller bestilling</Text>
          </Pressable>}
        </View>}

        {!history && next && <Pressable accessibilityRole="button" disabled={!!busy} onPress={() => {
          const apply = () => void change(order.id, () => updateOrderStage(order.id, next, order.status));
          if (next === "delivered") ask("Merk som levert?", "Bestillingen flyttes til historikken.", "Merk som levert", apply);
          else apply();
        }} style={[styles.button, { backgroundColor: colors.primaryFill, opacity: busy ? 0.6 : 1 }]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{busy === order.id ? "Oppdaterer …" : nextAction[next]}</Text>
        </Pressable>}
      </View>;
    })}
  </AdminPage>;
}

const styles = StyleSheet.create({
  section: { fontSize: 19, fontWeight: "700", marginTop: 20, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 12, gap: 12 },
  summary: { gap: 6 },
  summaryTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 6 },
  customer: { fontSize: 18, fontWeight: "800", flexShrink: 1 },
  badge: { borderRadius: 12, overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, fontSize: 12, fontWeight: "700" },
  details: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  button: { alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, minHeight: 44 },
  buttonText: { fontWeight: "700" },
});
