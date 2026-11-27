import { CancelOrderForm, OrderCancellation } from "../../components/OrderCancellation";
import { cancelCustomerRequest } from "../../services/adminRequestService";
import { useEffect, useState } from "react";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, Text, View } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import FeePanel from "../../components/FeePanel";
import KeyboardScrollView from "../../components/KeyboardScrollView";
import { WorkerOrderDetails } from "../../components/WorkerOrderDetails";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { ORDER_STAGE_LABELS, type OrderStage } from "../../services/customerOrders";
import { db } from "../../services/firebase";
import { advanceDelivery, isActiveWorkerOrder, takeOrder, type WorkerOrder } from "../../services/workerService";

const transitions = {
  ready: { stage: "picked_up", label: "Merk som hentet" },
  picked_up: { stage: "on_the_way", label: "Merk som på vei" },
} satisfies Partial<Record<OrderStage, { stage: OrderStage; label: string }>>;

export default function WorkerOrderPage() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  const { user, role } = useAuth();
  const { colors } = useAppTheme();
  const focused = useIsFocused();
  const [result, setResult] = useState<{ id: string; uid: string; order?: WorkerOrder; error?: string }>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (role !== "worker" || !user || !id || !focused) return;
    return onSnapshot(doc(db, "orderGroups", id), snapshot => {
      setResult({
        id, uid: user.uid,
        order: snapshot.exists() ? { ...snapshot.data(), id } as WorkerOrder : undefined,
      });
    }, () => setResult({ id, uid: user.uid, error: "Du har ikke lenger tilgang til dette oppdraget." }));
  }, [id, user?.uid, role, focused]);

  if (!user || role !== "worker" || !focused) return null;
  const current = result?.id === id && result?.uid === user.uid ? result : undefined;
  const order = current?.order;
  const ownsOrder = order?.assignedWorkerId === user.uid;
  const active = !!order && ownsOrder && isActiveWorkerOrder(order);
  const available = order?.assignmentStatus === "available" && !["cancelled", "delivered"].includes(order.status);
  const next = active && order ? (transitions as Partial<Record<OrderStage, { stage: OrderStage; label: string }>>)[order.status] : undefined;
  const blocked = order?.deliveryFee == null || ["pending", "declined"].includes(order.feeProposal?.status ?? "");
  const pickedUp = order?.status === "picked_up" || order?.status === "on_the_way";
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try { await action(); }
    catch (e) { Alert.alert("Kunne ikke oppdatere oppdraget", e instanceof Error ? e.message : "Prøv igjen."); }
    finally { setBusy(false); }
  };
  const button = (label: string, onPress: () => void, disabled = false) =>
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
      style={{ backgroundColor: colors.primaryFill, borderRadius: 12, padding: 15, opacity: disabled ? 0.5 : 1 }}>
      <Text style={{ color: colors.onPrimary, textAlign: "center", fontWeight: "800" }}>{busy ? "Oppdaterer …" : label}</Text>
    </Pressable>;

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <KeyboardScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate(from === "home" ? "/" : from === "history" ? "/worker-history" : "/worker-orders")} style={{ paddingVertical: 8 }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Tilbake</Text>
      </Pressable>
      {!current && <ActivityIndicator color={colors.primary} />}
      {current && (!order || (!ownsOrder && !available)) && <Text style={{ color: colors.textSecondary }}>{current.error ?? "Oppdraget er ikke lenger tilgjengelig."}</Text>}
      {order && (ownsOrder || available) && <>
        <View style={{ gap: 5 }}>
          <Text style={{ color: colors.textMuted }}>Oppdrag #{order.id.slice(-6)}</Text>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "800" }}>{order.customerName || "Levering"}</Text>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>{ORDER_STAGE_LABELS[order.status]}</Text>
          {order.completedAt && <Text style={{ color: colors.textMuted }}>Levert {order.completedAt.toDate().toLocaleString("nb-NO")}</Text>}
        </View>
        {available && button("Ta oppdrag", () => void run(() => takeOrder(order.id)), busy)}
        {next && !pickedUp && button(next.label, () => void run(() => advanceDelivery(order.id, next.stage)), busy || blocked)}
        {active && button("Ferdig · merk som levert", () =>
          Alert.alert("Bekreft levering", "Er bestillingen levert?", [
            { text: "Avbryt", style: "cancel" },
            { text: "Ferdig", onPress: () => void run(async () => {
              await advanceDelivery(order.id, "delivered");
              router.navigate("/");
            }) },
          ]), busy || blocked || !pickedUp)}
        {active && !pickedUp && <Text style={{ color: colors.textSecondary }}>
          {order.status === "ready" ? "Merk oppdraget som hentet for å aktivere Ferdig." : "Ferdig aktiveres etter at bestillingen er klar og du har merket den som hentet."}
        </Text>}
        {next && pickedUp && button(next.label, () => void run(() => advanceDelivery(order.id, next.stage)), busy || blocked)}
        <OrderCancellation order={order} />
        {active && blocked && <Text style={{ color: colors.danger }}>Leveringsprisen må godkjennes før henting.</Text>}
        <WorkerOrderDetails key={order.id} order={order} canCall={active} showEstimate={active || available} />
        {active && <FeePanel orderId={order.id} fee={order.deliveryFee} proposal={order.feeProposal}
          canPropose={!["picked_up", "on_the_way"].includes(order.status)} isCustomer={false} />}
        {active && <CancelOrderForm busy={busy} onCancel={reason => run(async () => {
          await cancelCustomerRequest(order.id, reason, "worker");
          router.navigate("/");
        })} />}
      </>}
    </KeyboardScrollView>
  </SafeAreaView>;
}
