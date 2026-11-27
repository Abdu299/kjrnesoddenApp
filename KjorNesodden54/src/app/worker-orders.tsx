import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, Pressable, ScrollView, Text } from "react-native";
import { WorkerOrderCard } from "../components/WorkerOrderCard";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { subscribeWorkerOrders, type WorkerOrder } from "../services/workerService";

export default function WorkerOrders() {
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const [available, setAvailable] = useState<WorkerOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setAvailable(null);
    setError("");
    if (!user || role !== "worker") return;
    const onError = (e: Error) => setError(e.message);
    return subscribeWorkerOrders(user.uid, "available", orders =>
      setAvailable(orders.filter(order => !["cancelled", "delivered"].includes(order.status))), onError);
  }, [user?.uid, role]);

  if (!user || role !== "worker") return null;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Oppdrag</Text>
      {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente oppdrag: {error}</Text>}
      <Section title="Ledige oppdrag" orders={available} error={error} />
      <Pressable accessibilityRole="button" onPress={() => router.push("/worker-history")} style={{ paddingVertical: 14 }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>Vis historikk ›</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function Section({ title, orders, error }: { title: string; orders: WorkerOrder[] | null; error: string }) {
  const { colors } = useAppTheme();
  return <>
    <Text style={{ color: colors.text, fontSize: 19, fontWeight: "700", marginVertical: 14 }}>{title}</Text>
    {!orders && !error && <ActivityIndicator color={colors.primary} />}
    {orders?.length === 0 && <Text style={{ color: colors.textMuted }}>Ingen oppdrag.</Text>}
    {orders?.map(order => <WorkerOrderCard key={order.id} order={order} />)}
  </>;
}
