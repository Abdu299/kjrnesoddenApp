import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import AddressAutocomplete from "./AddressAutocomplete";
import { db } from "../services/firebase";
import { resolveNesoddenAddress, type AddressSuggestion } from "../services/addressService";
import { useAppTheme } from "../context/ThemeContext";

export function RestaurantPickupEditor({ id, initialAddress }: { id: string; initialAddress?: string }) {
  const { colors } = useAppTheme();
  const [saved, setSaved] = useState(initialAddress ?? "");
  const [address, setAddress] = useState(saved);
  const [selected, setSelected] = useState<AddressSuggestion | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const clean = address.trim();
      const match = selected ?? (clean ? await resolveNesoddenAddress(clean) : null);
      if (clean && !match) {
        Alert.alert("Fant ikke adressen", "Velg en adresse fra forslagene for å lagre et gyldig hentested.");
        return;
      }
      const pickupAddress = match?.label ?? "";
      await updateDoc(doc(db, "restaurants", id), {
        pickupAddress,
        pickupCoordinates: match ? { latitude: match.latitude, longitude: match.longitude } : null,
      });
      setSaved(pickupAddress);
      setEditing(false);
    } catch (e) {
      Alert.alert("Kunne ikke lagre", e instanceof Error ? e.message : "Prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  return <View style={{ padding: 14, gap: 8 }}>
    <Text style={{ color: colors.text, fontWeight: "700" }}>Henteadresse</Text>
    {!editing ? <>
      <Text style={{ color: colors.textSecondary }}>{saved || "Ingen adresse lagt inn"}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setAddress(saved); setSelected(null); setEditing(true); }}>
        <Text style={{ color: colors.primary, fontWeight: "700" }}>{saved ? "Endre henteadresse" : "Søk etter henteadresse"}</Text>
      </Pressable>
    </> : <>
      <AddressAutocomplete purpose="pickup" value={address} disabled={saving}
        onChangeText={text => { setAddress(text); setSelected(null); }}
        onSelect={match => { setAddress(match.label); setSelected(match); }} />
      <View style={{ flexDirection: "row", gap: 18, paddingVertical: 8 }}>
        <Pressable accessibilityRole="button" disabled={saving || !address.trim()} onPress={() => void save()}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>{saving ? "Lagrer …" : "Lagre henteadresse"}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => setEditing(false)}>
          <Text style={{ color: colors.textSecondary }}>Avbryt</Text>
        </Pressable>
      </View>
    </>}
  </View>;
}
