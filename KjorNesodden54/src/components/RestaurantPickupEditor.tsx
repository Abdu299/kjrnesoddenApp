import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { resolveNesoddenAddress } from "../services/addressService";
import { useAppTheme } from "../context/ThemeContext";

export function RestaurantPickupEditor({ id, initialAddress }: { id: string; initialAddress?: string }) {
  const { colors } = useAppTheme(); const [address, setAddress] = useState(initialAddress ?? ""); const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try {
    const clean = address.trim(); const match = clean ? await resolveNesoddenAddress(clean) : null;
    await updateDoc(doc(db, "restaurants", id), { pickupAddress: clean, pickupCoordinates: match ? {latitude: match.latitude, longitude: match.longitude} : null });
    Alert.alert("Lagret", clean && !match ? "Adressen er lagret, men ble ikke funnet i adresseregisteret. Kjøretid til restauranten er ikke tilgjengelig før adressen kan bekreftes." : "Henteadressen er lagret.");
  } catch (e) { Alert.alert("Kunne ikke lagre", e instanceof Error ? e.message : "Prøv igjen."); } finally { setSaving(false); } };
  return <View style={{marginTop:12}}><Text style={{color:colors.text,fontWeight:"700"}}>Henteadresse for sjåfør</Text><TextInput value={address} onChangeText={setAddress} placeholder="Gateadresse, postnummer og sted" placeholderTextColor={colors.textMuted} style={{color:colors.text,borderColor:colors.border,borderWidth:1,borderRadius:8,padding:10,marginTop:6}} /><TouchableOpacity disabled={saving} onPress={save} style={{paddingVertical:10}}><Text style={{color:colors.primary,fontWeight:"700"}}>{saving ? "Lagrer …" : "Lagre henteadresse"}</Text></TouchableOpacity></View>;
}
