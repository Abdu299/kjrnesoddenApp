import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  AddressSuggestion,
  searchNesoddenAddresses,
} from "../services/addressService";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSelect: (address: AddressSuggestion) => void;
  disabled?: boolean;
  purpose?: "delivery" | "pickup";
};

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelect,
  disabled,
  purpose = "delivery",
}: Props) {
  const { styles, colors } = useThemedStyles(createStyles);

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  useEffect(() => {
    if (!focused || value.trim().length < 3 || value === selectedLabel) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const matches = await searchNesoddenAddresses(value, controller.signal);
        if (!controller.signal.aborted) setSuggestions(matches);
      } catch (error: any) {
        if (!controller.signal.aborted && error?.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [focused, selectedLabel, value]);

  const showSuggestions =
    focused && value.trim().length >= 3 && value !== selectedLabel;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          editable={!disabled}
          placeholder="Begynn å skrive gate og husnummer"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onChangeText={(text) => {
            setSelectedLabel("");
            onChangeText(text);
          }}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {showSuggestions && (
        <View style={styles.suggestions}>
          {!loading && suggestions.length === 0 ? (
            <Text style={styles.emptyText}>
              {purpose === "pickup" ? "Ingen treff. Prøv gate og husnummer uten poststed." : "Ingen treff. Du kan skrive hele adressen og lagre. Området må avklares før leveringsprisen kan beregnes."}
            </Text>
          ) : (
            suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestion}
                disabled={disabled}
                onPress={() => {
                  setSelectedLabel(suggestion.label);
                  setSuggestions([]);
                  setFocused(false);
                  onSelect(suggestion);
                }}
              >
                <View style={styles.suggestionText}>
                  <Text style={styles.street}>{suggestion.streetAddress}</Text>
                  <Text style={styles.place}>
                    {suggestion.postalCode} {suggestion.postalPlace}
                  </Text>
                </View>
                {purpose === "delivery" && <Text style={styles.fee}>{suggestion.zone.name}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <Text style={styles.helper}>
        {purpose === "pickup" ? "Velg et forslag for å lagre adressen med kartpunkt." : "Velg et adresseforslag for riktig område. Leveringsprisen beregnes fra både hentestedet og adressen din."}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { marginBottom: 4, zIndex: 20 },
  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.inputBackground,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, minHeight: 50, fontSize: 16, color: colors.text },
  suggestions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  suggestion: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionText: { flex: 1 },
  street: { color: colors.text, fontSize: 15, fontWeight: "700" },
  place: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  fee: { color: colors.primary, fontSize: 15, fontWeight: "800", marginLeft: 12, maxWidth: 115, textAlign: "right" },
  emptyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, padding: 14 },
  helper: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 },
});

