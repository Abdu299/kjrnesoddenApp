import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";

const choices = [
  { value: "system", label: "Automatisk", english: "Automatic" },
  { value: "light", label: "Lys", english: "Light" },
  { value: "dark", label: "Mørk", english: "Dark" },
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
        <Ionicons name="contrast-outline" size={18} color={colors.textMuted} />
        <Text style={styles.title}>{english ? "Appearance" : "Utseende"}</Text>
        <Text style={styles.current} accessibilityLiveRegion="polite">{selectedLabel}</Text>
      </View>
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
              onPress={() => setPreference(choice.value)}
              style={[styles.choice, choice.value === "system" && styles.systemChoice,
                selected && styles.choiceSelected]}
              activeOpacity={0.8}
            >
              <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
                {english ? choice.english : choice.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {saveError && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {english
            ? "Could not save. Tap your choice again to retry."
            : "Kunne ikke lagre. Trykk på valget ditt igjen for å prøve på nytt."}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },
  current: { color: colors.textMuted, fontSize: 12, flexShrink: 1, textAlign: "right" },
  choices: { flexDirection: "row", gap: 6, marginTop: 10 },
  choice: {
    flex: 1, minHeight: 44, paddingHorizontal: 6, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
    backgroundColor: colors.inputBackground, justifyContent: "center",
  },
  systemChoice: { flex: 1.3 },
  choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  choiceLabel: {
    color: colors.textSecondary, fontSize: 13, fontWeight: "500", textAlign: "center",
  },
  choiceLabelSelected: { color: colors.primary, fontWeight: "700" },
  error: { color: colors.danger, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
