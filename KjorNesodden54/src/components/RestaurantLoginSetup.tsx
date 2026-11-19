import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Restaurant } from "../services/adminRestaurantService";
import { createRestaurantLogin } from "../services/restaurantLoginService";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";

export default function RestaurantLoginSetup({ restaurant, onCreated }: {
  restaurant: Restaurant; onCreated: () => void;
}) {
  const { styles, colors } = useThemedStyles(createStyles);
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [createdName, setCreatedName] = useState("");

  async function save() {
    if (pending.current) return;
    if (code.trim().length < 6) { setError("Koden må være minst 6 tegn."); return; }
    if (code.trim() !== confirmation.trim()) { setError("Kodene er ikke like."); return; }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await createRestaurantLogin(restaurant.id, code);
      setCode("");
      setConfirmation("");
      setCreatedName(result.loginName);
      setExpanded(false);
      onCreated();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Kunne ikke opprette innloggingen. Prøv igjen med samme kode.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (createdName) return <Text style={styles.success} accessibilityLiveRegion="polite">
    Innlogging opprettet. Logg inn som «{createdName}» med koden du valgte.
  </Text>;
  if (restaurant.authUid) return <Text style={styles.info}>Innloggingsnavn: {restaurant.loginName || restaurant.name}</Text>;

  return <View style={styles.container}>
    {!expanded ? <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={() => setExpanded(true)}>
      <Text style={styles.buttonText}>Opprett innlogging</Text>
    </TouchableOpacity> : <>
      <Text style={styles.title}>Restaurantinnlogging</Text>
      <Text style={styles.info}>Innloggingsnavn: {restaurant.loginName || restaurant.name}. Velg og ta vare på restaurantkoden.</Text>
      <TextInput accessibilityLabel="Ny restaurantkode" placeholder="Kode, minst 6 tegn" placeholderTextColor={colors.placeholder}
        style={styles.input} value={code} onChangeText={setCode} secureTextEntry autoCapitalize="none"
        autoCorrect={false} editable={!busy} textContentType="newPassword" />
      <TextInput accessibilityLabel="Gjenta restaurantkode" placeholder="Gjenta koden" placeholderTextColor={colors.placeholder}
        style={styles.input} value={confirmation} onChangeText={setConfirmation} secureTextEntry autoCapitalize="none"
        autoCorrect={false} editable={!busy} textContentType="newPassword" />
      {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
      <TouchableOpacity accessibilityRole="button" style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={save}>
        <Text style={styles.buttonText}>{busy ? "Oppretter…" : "Lagre restaurantkode"}</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.cancel} disabled={busy} onPress={() => {
        setExpanded(false); setCode(""); setConfirmation(""); setError("");
      }}><Text style={styles.info}>Avbryt</Text></TouchableOpacity>
    </>}
  </View>;
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { marginTop: 12, gap: 10 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  info: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
    paddingHorizontal: 12, color: colors.text, backgroundColor: colors.inputBackground, fontSize: 16 },
  button: { minHeight: 44, borderRadius: 10, padding: 12, alignItems: "center", backgroundColor: colors.primarySoft },
  buttonText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  cancel: { minHeight: 44, justifyContent: "center", alignItems: "center" },
  error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  success: { color: colors.success, fontSize: 14, lineHeight: 21, marginTop: 12 },
  disabled: { opacity: 0.6 },
});
