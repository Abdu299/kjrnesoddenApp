import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { router, useIsFocused } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { ORDER_STAGE_LABELS, subscribeOrders, type CustomerOrder } from "../services/customerOrders";

export default function CustomerOrderList({ history = false }: { history?: boolean }) {
  const { user, role, loading: authLoading } = useAuth();
  const { colors } = useAppTheme();
  const focused = useIsFocused();
  const uid = role === "customer" ? user?.uid : undefined;
  const [result, setResult] = useState<{ uid: string; orders: CustomerOrder[]; error?: string }>();

  useEffect(() => {
    if (!uid || !focused) return;
    return subscribeOrders(false,
      orders => setResult({ uid, orders }),
      error => setResult({ uid, orders: [], error: error.message }));
  }, [uid, focused]);

  const current = result?.uid === uid ? result : undefined;
  const orders = (current?.orders ?? []).filter(order =>
    (order.status === "delivered" || order.status === "cancelled") === history);
  const canViewOrders = !!uid && !authLoading;

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <FlatList
      data={canViewOrders ? orders : []}
      keyExtractor={order => order.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<View style={styles.header}>
        {history && <Pressable accessibilityRole="button" onPress={() => router.navigate("/my-orders")} style={styles.back}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Mine bestillinger</Text>
        </Pressable>}
        <Text style={[styles.title, { color: colors.text }]}>{history ? "Tidligere bestillinger" : "Mine bestillinger"}</Text>
        {!history && canViewOrders && <Pressable accessibilityRole="button" onPress={() => router.push("/customer-order-history")}
          style={[styles.historyButton, { backgroundColor: colors.primarySoft }]}>
          <Text style={{ color: colors.primary, fontWeight: "800" }}>Vis tidligere bestillinger ›</Text>
        </Pressable>}
        {!history && canViewOrders && <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700" }}>Aktive bestillinger</Text>}
      </View>}
      ListEmptyComponent={authLoading || (canViewOrders && !current)
        ? <ActivityIndicator color={colors.primary} />
        : <Text style={{ color: current?.error ? colors.danger : colors.textMuted }}>
          {!canViewOrders ? "Logg inn som kunde for å se bestillingene dine."
            : current?.error ? `Kunne ikke hente bestillingene: ${current.error}`
            : history ? "Du har ingen tidligere bestillinger." : "Du har ingen aktive bestillinger."}
        </Text>}
      renderItem={({ item: order }) => (
        <Pressable accessibilityRole="button" onPress={() => router.push({
          pathname: "/customer-order/[id]",
          params: history ? { id: order.id, from: "history" } : { id: order.id },
        })} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 17 }}>{ORDER_STAGE_LABELS[order.status] ?? "Ukjent status"}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 5 }}>
            {order.createdAt?.toDate?.().toLocaleString("nb-NO") ?? "Registreres…"} · #{order.id.slice(-6)} · Trykk for detaljer
          </Text>
        </Pressable>
      )}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  header: { gap: 14, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: "800" },
  back: { paddingVertical: 10 },
  historyButton: { borderRadius: 12, padding: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
});
