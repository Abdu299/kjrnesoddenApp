import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { ORDER_STAGE_LABELS } from "../services/customerOrders";
import type { WorkerOrder } from "../services/workerService";

export function WorkerOrderCard({ order, fromHome = false, fromHistory = false }: { order: WorkerOrder; fromHome?: boolean; fromHistory?: boolean }) {
  const { colors } = useAppTheme();
  const restaurants = [...new Set((order.items ?? []).map(item => item.restaurantName).filter(Boolean))];
  return <Pressable accessibilityRole="button"
    onPress={() => router.push({ pathname: "/worker-order/[id]", params: { id: order.id, from: fromHome ? "home" : fromHistory ? "history" : "orders" } })}
    style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12, gap: 6 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", flexShrink: 1 }}>{order.customerName || "Kunde"}</Text>
      <Text style={{ color: colors.primary, fontWeight: "700" }}>{ORDER_STAGE_LABELS[order.status]}</Text>
    </View>
    {!!order.address && <Text style={{ color: colors.textSecondary }}>{order.address}</Text>}
    {!!restaurants.length && <Text style={{ color: colors.textSecondary }}>{restaurants.join(", ")}</Text>}
    <Text style={{ color: colors.textMuted }}>#{order.id.slice(-6)} · Levering {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text>
    <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 4 }}>Åpne oppdrag ›</Text>
  </Pressable>;
}
