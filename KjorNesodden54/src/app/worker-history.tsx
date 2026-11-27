import { useEffect, useState } from "react";
import { router, useIsFocused } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text } from "react-native";
import { WorkerOrderCard } from "../components/WorkerOrderCard";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { subscribeWorkerOrders, type WorkerOrder } from "../services/workerService";

export default function WorkerHistory() {
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const focused = useIsFocused();
  const [orders, setOrders] = useState<WorkerOrder[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setOrders(null);
    setError("");
    if (!focused || role !== "worker" || !user) return;
    return subscribeWorkerOrders(user.uid, "mine", value =>
      setOrders(value.filter(order => order.status === "delivered" || order.status === "cancelled")),
      e => setError(e.message));
  }, [focused, role, user?.uid]);
  if (!user || role !== "worker") return null;
  const delivered = orders?.filter(order => order.status === "delivered");
  const cancelled = orders?.filter(order => order.status === "cancelled");
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate("/login")} style={{ paddingVertical: 10 }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Profil</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800", marginBottom: 16 }}>Oppdragshistorikk</Text>
      {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente historikken: {error}</Text>}
      {!orders && !error && <ActivityIndicator color={colors.primary} />}
      {delivered && <>
        <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginBottom: 10 }}>Leverte oppdrag</Text>
        {delivered.length === 0 && <Text style={{ color: colors.textMuted }}>Du har ingen leverte oppdrag ennå.</Text>}
        {delivered.map(order => <WorkerOrderCard key={order.id} order={order} fromHistory />)}
      </>}
      {!!cancelled?.length && <>
        <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginTop: 18, marginBottom: 10 }}>Kansellerte oppdrag</Text>
        {cancelled.map(order => <WorkerOrderCard key={order.id} order={order} fromHistory />)}
      </>}
    </ScrollView>
  </SafeAreaView>;
}
