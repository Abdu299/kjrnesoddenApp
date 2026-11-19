import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { deliveryAreas, type DeliveryAreaId } from "../services/deliveryPricing";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";

export default function DeliveryAreaPicker({ value, onChange }: {
  value: DeliveryAreaId | null; onChange: (value: DeliveryAreaId) => void;
}) {
  const { styles } = useThemedStyles(createStyles);
  return <View style={styles.container}>
    <Text style={styles.label}>Restaurantens område</Text>
    <View style={styles.options} accessibilityRole="radiogroup">
      {deliveryAreas.map((area) => <TouchableOpacity key={area.id}
        accessibilityRole="radio" accessibilityState={{ checked: value === area.id }}
        accessibilityLabel={area.name} onPress={() => onChange(area.id)}
        style={[styles.option, value === area.id && styles.selected]}>
        <Text style={styles.text}>{area.name}</Text>
      </TouchableOpacity>)}
    </View>
    {!value && <Text style={styles.hint}>Velg området der maten hentes, slik at leveringsprisen blir riktig.</Text>}
  </View>;
}
const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { marginBottom: 18 }, label: { color: colors.text, fontSize: 14, fontWeight: "700", marginBottom: 8 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  text: { color: colors.text, fontWeight: "600" }, hint: { color: colors.textMuted, marginTop: 8, lineHeight: 20 },
});
