import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useDelivery } from "../context/DeliveryContext";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";
import { deliveryAreas, validDeliveryFee, type DeliveryPricing } from "../services/deliveryPricing";
import { saveDeliveryPricing } from "../services/deliveryPricingService";

export default function DeliveryPricingEditor() {
  const delivery = useDelivery();
  const { styles, colors } = useThemedStyles(createStyles);
  const [draft, setDraft] = useState<{ revision: number; sameAreaFee: string; areaFees: Record<string, string> } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const open = () => {
    setMessage("");
    setDraft({ revision: delivery.pricing.revision, sameAreaFee: String(delivery.pricing.sameAreaFee),
      areaFees: Object.fromEntries(deliveryAreas.map((area) => [area.id, String(delivery.pricing.areaFees[area.id])])) });
  };
  const save = async () => {
    if (!draft || saving) return;
    const amounts = [draft.sameAreaFee, ...deliveryAreas.map((area) => draft.areaFees[area.id])];
    if (amounts.some((amount) => !/^\d+$/.test(amount.trim()) || !validDeliveryFee(Number(amount)))) {
      setMessage("Skriv hele kroner mellom 0 og 10 000 i alle prisfeltene."); return;
    }
    setSaving(true); setMessage("");
    try {
      const pricing: DeliveryPricing = { schemaVersion: 1, revision: draft.revision,
        sameAreaFee: Number(draft.sameAreaFee),
        areaFees: Object.fromEntries(deliveryAreas.map((area) => [area.id, Number(draft.areaFees[area.id])])) as DeliveryPricing["areaFees"] };
      await saveDeliveryPricing(pricing, draft.revision);
      await delivery.refreshPricing();
      setDraft(null); setMessage("Leveringsprisene er lagret og oppdatert i appen.");
    } catch (error: any) {
      setMessage(error.code ? "Kunne ikke lagre prisene. Kontroller administratortilgangen og prøv igjen." : error.message);
    } finally { setSaving(false); }
  };
  return <View style={styles.card}>
    <Text style={styles.title}>Leveringspriser</Text>
    <Text style={styles.description}>{delivery.pricingLoading ? "Henter leveringspriser…" : delivery.pricingError
      ? "Administrer satsene for lokal levering og levering mellom områdene."
      : `Samme område: ${delivery.pricing.sameAreaFee} kr. Mellom ulike områder brukes den høyeste områdesatsen.`}</Text>
    {delivery.pricingError ? <>
      <Text style={styles.message}>{delivery.pricingError}</Text>
      <TouchableOpacity style={styles.secondary} onPress={delivery.reload}><Text style={styles.secondaryText}>Prøv igjen</Text></TouchableOpacity>
    </> : draft ? <>
      {!delivery.saved && <Text style={styles.description}>Standardprisene brukes frem til du lagrer første gang.</Text>}
      <Text style={styles.label}>Levering innen samme område (kr)</Text>
      <TextInput style={styles.input} value={draft.sameAreaFee} keyboardType="number-pad" editable={!saving}
        accessibilityLabel="Pris innen samme område" placeholderTextColor={colors.placeholder}
        onChangeText={(sameAreaFee) => setDraft({ ...draft, sameAreaFee })} />
      {deliveryAreas.map((area) => <View key={area.id} style={styles.row}>
        <Text style={styles.area}>{area.name}</Text>
        <TextInput style={[styles.input, styles.amount]} value={draft.areaFees[area.id]}
          keyboardType="number-pad" editable={!saving} accessibilityLabel={`Områdesats ${area.name}`}
          onChangeText={(amount) => setDraft({ ...draft, areaFees: { ...draft.areaFees, [area.id]: amount } })} />
      </View>)}
      <Text style={styles.description}>Én leveringspris per bestilling. Ved flere restauranter brukes den høyeste ruteprisen. Fri bestilling avtales separat.</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondary} disabled={saving} onPress={() => { setDraft(null); setMessage(""); }}><Text style={styles.secondaryText}>Avbryt</Text></TouchableOpacity>
        <TouchableOpacity style={styles.primary} disabled={saving} onPress={save}><Text style={styles.primaryText}>{saving ? "Lagrer…" : "Lagre priser"}</Text></TouchableOpacity>
      </View>
    </> : <TouchableOpacity style={styles.secondary} onPress={open} disabled={delivery.pricingLoading}>
      <Text style={styles.secondaryText}>{delivery.pricingLoading ? "Henter priser…" : "Endre leveringspriser"}</Text>
    </TouchableOpacity>}
    {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
  </View>;
}
const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 18, marginBottom: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 8 },
  description: { color: colors.textMuted, lineHeight: 21, marginBottom: 12 },
  label: { color: colors.text, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  area: { flex: 1, color: colors.text, fontWeight: "600" },
  input: { minHeight: 48, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: 10, backgroundColor: colors.inputBackground, color: colors.text, fontSize: 16 },
  amount: { width: 96, textAlign: "right" }, actions: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondary: { minHeight: 44, justifyContent: "center", alignItems: "center", paddingHorizontal: 16,
    paddingVertical: 10, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: 10 },
  secondaryText: { color: colors.primary, fontWeight: "700" },
  primary: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16, backgroundColor: colors.primaryFill, borderRadius: 10 },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  message: { color: colors.text, lineHeight: 21, marginTop: 12 },
});
