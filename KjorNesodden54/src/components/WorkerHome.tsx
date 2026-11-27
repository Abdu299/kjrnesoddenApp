import { useEffect, useState } from "react";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WorkerOrderCard } from "./WorkerOrderCard";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { useWorkerLocation } from "../context/WorkerLocationContext";
import { isActiveWorkerOrder, subscribeWorkerOrders, type WorkerOrder } from "../services/workerService";

export default function WorkerHome() {
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const { message } = useWorkerLocation();
  const [mine, setMine] = useState<WorkerOrder[] | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setMine(null);
    setOrderIds([]);
    setError("");
    if (!user || role !== "worker") return;
    let active = true;
    const key = `worker-order-${user.uid}`;
    void AsyncStorage.getItem(key).then(value => {
      if (!value || !active) return;
      const ids: unknown = JSON.parse(value);
      if (Array.isArray(ids)) setOrderIds(ids.filter(id => typeof id === "string"));
    }).catch(() => {});
    const stop = subscribeWorkerOrders(user.uid, "mine", setMine, e => setError(e.message));
    return () => { active = false; stop(); };
  }, [user?.uid, role]);

  const rank = new Map(orderIds.map((id, index) => [id, index]));
  const activeOrders = (mine ?? []).filter(isActiveWorkerOrder).sort((a, b) =>
    (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity));
  const move = (index: number, step: number) => {
    if (!user) return;
    const ids = activeOrders.map(order => order.id);
    const destination = index + step;
    if (destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    setOrderIds(ids);
    void AsyncStorage.setItem(`worker-order-${user.uid}`, JSON.stringify(ids)).catch(() => {});
  };

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ color: colors.text, fontSize: 27, fontWeight: "800" }}>Mine oppdrag</Text>
      <Text style={{ color: colors.textMuted, marginTop: 6, marginBottom: 20 }}>{message}</Text>
      {!!error && <Text style={{ color: colors.danger }}>Kunne ikke hente oppdrag: {error}</Text>}
      {!mine && !error && <ActivityIndicator color={colors.primary} />}
      {mine && !activeOrders.length && <Text style={{ color: colors.textSecondary }}>Du har ingen aktive oppdrag.</Text>}
      {activeOrders.map((order, index) => <View key={order.id}>
        <WorkerOrderCard order={order} fromHome />
        {activeOrders.length > 1 && <View style={{ flexDirection: "row", gap: 16, marginBottom: 14 }}>
          {index > 0 && <Pressable accessibilityRole="button" onPress={() => move(index, -1)}><Text style={{ color: colors.primary }}>Flytt opp</Text></Pressable>}
          {index < activeOrders.length - 1 && <Pressable accessibilityRole="button" onPress={() => move(index, 1)}><Text style={{ color: colors.primary }}>Flytt ned</Text></Pressable>}
        </View>}
      </View>)}
      <Pressable accessibilityRole="button" onPress={() => router.navigate("/worker-orders")} style={{ paddingVertical: 15 }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>Se ledige oppdrag ›</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}
