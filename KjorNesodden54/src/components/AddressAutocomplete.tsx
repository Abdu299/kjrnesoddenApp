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
};

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelect,
  disabled,
}: Props) {
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
        setSuggestions(matches);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
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
          placeholderTextColor="#A0A0A0"
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onChangeText={(text) => {
            setSelectedLabel("");
            onChangeText(text);
          }}
        />
        {loading && <ActivityIndicator size="small" color="#208AEF" />}
      </View>

      {showSuggestions && (
        <View style={styles.suggestions}>
          {!loading && suggestions.length === 0 ? (
            <Text style={styles.emptyText}>
              Ingen treff. Du kan skrive hele adressen og lagre. Leveringsprisen avtales.
            </Text>
          ) : (
            suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestion}
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
                <Text style={styles.fee}>{suggestion.zone.fee} kr</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <Text style={styles.helper}>
        Velg et forslag for fast leveringspris. Ved manuell adresse avtales prisen.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4, zIndex: 20 },
  inputWrapper: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, minHeight: 50, fontSize: 16, color: "#111111" },
  suggestions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E2E2E2",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  suggestion: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
    flexDirection: "row",
    alignItems: "center",
  },
  suggestionText: { flex: 1 },
  street: { color: "#111111", fontSize: 15, fontWeight: "700" },
  place: { color: "#777777", fontSize: 13, marginTop: 3 },
  fee: { color: "#208AEF", fontSize: 15, fontWeight: "800", marginLeft: 12 },
  emptyText: { color: "#666666", fontSize: 14, lineHeight: 20, padding: 14 },
  helper: { color: "#777777", fontSize: 12, lineHeight: 17, marginTop: 8 },
});
