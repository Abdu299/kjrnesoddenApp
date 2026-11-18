import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors, ThemePreference } from "../constants/app-theme";

const choices = [
  { value: "system", label: "Automatisk", english: "Automatic", icon: "phone-portrait-outline" },
  { value: "light", label: "Lys", english: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Mørk", english: "Dark", icon: "moon-outline" },
] as const;

export default function AppearanceSettings({ english = false }: { english?: boolean }) {
  const { styles, colors, preference, colorScheme, ready, saveError, setPreference } =
    useThemedStyles(createStyles);
  const systemLabel = Platform.OS === "web"
    ? english ? "Follows your device" : "Følger enheten din"
    : english ? "Follows your phone" : "Følger mobilen";
  const selectedLabel = preference === "system"
    ? systemLabel
    : colorScheme === "dark"
      ? english ? "Dark mode" : "Mørk modus"
      : english ? "Light mode" : "Lys modus";

  return (
    <View style={styles.card} testID="appearance-settings">
      <View style={styles.header}>
        <View style={styles.icon}>
          <Ionicons name="contrast-outline" size={25} color={colors.primary} />
        </View>
        <View style={styles.heading}>
          <Text style={styles.title}>{english ? "Appearance" : "Utseende"}</Text>
          <Text style={styles.current} accessibilityLiveRegion="polite">{selectedLabel}</Text>
        </View>
      </View>
      <Text style={styles.description}>
        {english
          ? "Choose light or dark mode. Automatic follows your device's settings."
          : "Velg lys eller mørk modus. Automatisk følger innstillingen på enheten din."}
      </Text>
      <View style={styles.choices} accessibilityRole="radiogroup"
        accessibilityLabel={english ? "App appearance" : "Appens utseende"}>
        {choices.map((choice) => {
          const selected = preference === choice.value;
          return (
            <TouchableOpacity
              key={choice.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: !ready }}
              accessibilityLabel={english ? choice.english : choice.label}
              accessibilityHint={choice.value === "system" ? systemLabel : undefined}
              disabled={!ready}
              onPress={() => setPreference(choice.value as ThemePreference)}
              style={[styles.choice, choice.value === "system" && styles.systemChoice,
                selected && styles.choiceSelected]}
              activeOpacity={0.8}
            >
              <View style={styles.choiceIcon}>
                <Ionicons name={choice.icon} size={23}
                  color={selected ? colors.primary : colors.textSecondary} />
                {selected && <Ionicons name="checkmark-circle" size={17} color={colors.primary} />}
              </View>
              <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                {english ? choice.english : choice.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.note, saveError && styles.error]} accessibilityLiveRegion="polite">
        {saveError
          ? english
            ? "Could not save. Tap your choice again to retry."
            : "Kunne ikke lagre. Trykk på valget ditt igjen for å prøve på nytt."
          : english ? "Your choice is saved on this device." : "Valget ditt huskes på denne enheten."}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.primaryBorder,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 18,
    marginBottom: 22,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center",
  },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800" },
  current: { color: colors.primary, fontSize: 13, fontWeight: "600", marginTop: 3 },
  description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 13 },
  choices: { flexDirection: "row", gap: 8, marginTop: 16 },
  choice: {
    flex: 1, minHeight: 88, paddingHorizontal: 8, paddingVertical: 13,
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 13,
    backgroundColor: colors.inputBackground, justifyContent: "center",
  },
  systemChoice: { flex: 1.3 },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceIcon: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5 },
  choiceLabel: {
    color: colors.textSecondary, fontSize: 13, fontWeight: "600",
    textAlign: "center", marginTop: 9,
  },
  choiceLabelSelected: { color: colors.primary, fontWeight: "800" },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  error: { color: colors.danger },
});
