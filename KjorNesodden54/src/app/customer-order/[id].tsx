import { useEffect, useState } from "react";
import { router, useIsFocused, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import FeePanel from "../../components/FeePanel";
import { OrderCancellation } from "../../components/OrderCancellation";
import { useAuth } from "../../context/AuthContext";
import { useAppTheme } from "../../context/ThemeContext";
import { ORDER_STAGE_LABELS, type CustomerOrder } from "../../services/customerOrders";
import { db } from "../../services/firebase";

export default function CustomerOrderPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, role, loading } = useAuth();
  const { colors } = useAppTheme();
  const focused = useIsFocused();
  const [result, setResult] = useState<{ id: string; uid: string; order: CustomerOrder | null }>();

  useEffect(() => {
    if (!id || !user || role !== "customer" || !focused) return;
    return onSnapshot(doc(db, "orderGroups", id), snapshot => {
      const data = snapshot.data();
      setResult({ id, uid: user.uid, order: data?.customerId === user.uid ? { ...data, id } as CustomerOrder : null });
    }, () => setResult({ id, uid: user.uid, order: null }));
  }, [id, user?.uid, role, focused]);

  const current = result?.id === id && result?.uid === user?.uid ? result : undefined;
  const order = role === "customer" && focused ? current?.order : null;
  const card = { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 15, gap: 7 };
  const heading = (title: string) => <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>{title}</Text>;
  const info = (value: string) => <Text style={{ color: colors.textSecondary }}>{value}</Text>;
  const date = order?.createdAt?.toDate?.().toLocaleString("nb-NO");

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 14 }}>
      <Pressable accessibilityRole="button" onPress={() => router.navigate("/my-orders")} style={{ paddingVertical: 10 }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>‹ Mine bestillinger</Text>
      </Pressable>
      <Text style={{ color: colors.text, fontSize: 26, fontWeight: "800" }}>Bestilling #{id?.slice(-6)}</Text>
      {(loading || (role === "customer" && !current)) && <ActivityIndicator color={colors.primary} />}
      {!loading && (role !== "customer" || current?.order === null) && info("Bestillingen er ikke tilgjengelig.")}
      {order && <>
        <View style={card}>
          {heading(ORDER_STAGE_LABELS[order.status] ?? "Ukjent status")}
          {date && info(`Bestilt ${date}`)}
          {order.completedAt && info(`Levert ${order.completedAt.toDate().toLocaleString("nb-NO")}`)}
        </View>
        <OrderCancellation order={order} showActor={false} />
        <View style={card}>
          {heading("Levering")}
          {!!order.customerName && info(order.customerName)}
          {info(order.address || "Adresse mangler")}
        </View>
        <View style={card}>
          {heading("Varer og priser")}
          {(order.items ?? []).map((item, index) => <View key={index} style={{ gap: 3 }}>
            <Text style={{ color: colors.text, fontWeight: "700" }}>{item.quantity} × {item.productName} · {item.restaurantName}</Text>
            {info(item.type === "custom" || item.customRequest ? "Varepris avtales" : `${item.price} kr/stk`)}
            {!!item.customRequest && info(item.customRequest)}
          </View>)}
          {info(`Kjente varepriser: ${order.totalPrice} kr`)}
          {info(`Levering: ${order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}`)}
          {order.deliveryFee != null && heading(`Sum kjente priser: ${order.totalPrice + order.deliveryFee} kr`)}
          <FeePanel orderId={order.id} fee={order.deliveryFee} proposal={order.feeProposal}
            canPropose={false} isCustomer={order.status !== "cancelled" && order.status !== "delivered"} />
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
