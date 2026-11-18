import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { WeeklyOpeningHours } from "../services/openingHoursService";
import { openingDayLabels } from "../services/openingHoursService";

type Props = {
  value: WeeklyOpeningHours;
  onChange: (value: WeeklyOpeningHours) => void;
};

export default function OpeningHoursEditor({ value, onChange }: Props) {
  const { styles } = useThemedStyles(createStyles);

  const updateDay = (day: number, field: "open" | "close", text: string) => {
    const next = value.map((period) => (period ? { ...period } : null));
    next[day] = { open: next[day]?.open ?? "10:00", close: next[day]?.close ?? "22:00", [field]: text };
    onChange(next);
  };

  const toggleDay = (day: number) => {
    const next = value.map((period) => (period ? { ...period } : null));
    next[day] = next[day] ? null : { open: "10:00", close: "22:00" };
    onChange(next);
  };

  // Show Monday first even though storage uses Sunday first.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Åpningstider</Text>
      {order.map((day) => {
        const period = value[day];
        return (
          <View key={day} style={styles.row}>
            <Text style={styles.day}>{openingDayLabels[day]}</Text>
            {period ? (
              <View style={styles.timeRow}>
                <TextInput style={styles.timeInput} value={period.open} onChangeText={(text) => updateDay(day, "open", text)} placeholder="10:00" />
                <Text style={styles.dash}>–</Text>
                <TextInput style={styles.timeInput} value={period.close} onChangeText={(text) => updateDay(day, "close", text)} placeholder="22:00" />
              </View>
            ) : (
              <Text style={styles.closed}>Stengt</Text>
            )}
            <TouchableOpacity style={styles.toggle} onPress={() => toggleDay(day)}>
              <Text style={styles.toggleText}>{period ? "Steng" : "Åpne"}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { marginTop: 18, marginBottom: 18 },
  title: { color: colors.text, fontSize: 16, fontWeight: "800", marginBottom: 10 },
  row: { minHeight: 48, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 8 },
  day: { width: 67, color: colors.text, fontSize: 13, fontWeight: "700" },
  timeRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  timeInput: { width: 58, height: 36, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, textAlign: "center", color: colors.text, backgroundColor: colors.inputBackground, fontSize: 13 },
  dash: { color: colors.textMuted },
  closed: { flex: 1, color: colors.textMuted, fontSize: 13 },
  toggle: { minWidth: 51, minHeight: 34, borderRadius: 8, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center", paddingHorizontal: 7 },
  toggleText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});

