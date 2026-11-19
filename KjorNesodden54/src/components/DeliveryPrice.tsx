import { StyleSheet, Text, View } from "react-native";
import { useDelivery } from "../context/DeliveryContext";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import { areaName, routeDeliveryFee, type DeliveryAreaId, type DeliveryRestaurant } from "../services/deliveryPricing";

export default function DeliveryPrice({ restaurant, customerAreaId }: {
  restaurant: DeliveryRestaurant; customerAreaId: DeliveryAreaId | null;
}) {
  const delivery = useDelivery();
  const { styles } = useThemedStyles(createStyles);
  const latest = delivery.restaurants.find((item) => item.id === restaurant.id) ?? restaurant;
  const fee = routeDeliveryFee(latest.deliveryAreaId, customerAreaId, delivery.pricing);
  let text = fee === null ? "Levering beregnes når område og adresse er kjent."
    : `Levering: ${fee.toLocaleString("nb-NO")} kr${latest.deliveryAreaId === customerAreaId ? " · lokalt" : ""}`;
  if (delivery.pricingLoading || delivery.restaurantsLoading) text = "Henter leveringspris…";
  if (delivery.pricingError || delivery.restaurantsError) text = "Leveringsprisen er midlertidig utilgjengelig.";
  return <View style={styles.container}>
    <Text style={styles.price}>{text}</Text>
    {customerAreaId && latest.deliveryAreaId && !delivery.pricingError && !delivery.restaurantsError &&
      <Text style={styles.area}>{areaName(latest.deliveryAreaId)} → {areaName(customerAreaId)}</Text>}
  </View>;
}
const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { marginTop: 10, marginBottom: 8 },
  price: { color: colors.primary, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  area: { color: colors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 18 },
});
