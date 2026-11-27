import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text } from "react-native";
import { WorkerOrderCard } from "../components/WorkerOrderCard";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { isActiveWorkerOrder, subscribeWorkerOrders, type WorkerOrder } from "../services/workerService";

export default function WorkerOrders() {
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const [available, setAvailable] = useState<WorkerOrder[] | null>(null);
  const [history, setHistory] = useState<WorkerOrder[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setAvailable(null);
    setHistory(null);
    setError("");
    if (!user || role !== "worker") return;
    const onError = (e: Error) => setError(e.message);
    const stopAvailable = subscribeWorkerOrders(user.uid, "available", orders =>
      setAvailable(orders.filter(order => !["cancelled", "delivered"].includes(order.status))), onError);
    const stopMine = subscribeWorkerOrders(user.uid, "mine", orders =>
      setHistory(orders.filter(order => !isActiveWorkerOrder(order))), onError);
    return () => { stopAvailable(); stopMine(); };
  }, [user?.uid, role]);

  if (!user || role !== "worker") return null;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Oppdrag</Text>
      {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente oppdrag: {error}</Text>}
      {[{ title: "Ledige oppdrag", orders: available }, { title: "Historikk", orders: history }].map(section => (
        <Section key={section.title} title={section.title} orders={section.orders} error={error} />
      ))}
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
