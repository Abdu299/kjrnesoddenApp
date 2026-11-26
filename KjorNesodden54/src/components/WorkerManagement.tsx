import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { createWorkerAccount, setWorkerActive, subscribeWorkers, type WorkerAccount } from "../services/workerService";
export default function WorkerManagement() {
  const { colors } = useAppTheme();
  const [workers, setWorkers] = useState<WorkerAccount[]>([]); const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  useEffect(() => subscribeWorkers(setWorkers, e => setError(e.message)), []);
  const create = async () => { try { setBusy(true); await createWorkerAccount(name, email, password); setName(""); setEmail(""); setPassword(""); Alert.alert("Opprettet", "Sjåførkontoen er klar."); } catch (e) { Alert.alert("Kunne ikke opprette", e instanceof Error ? e.message : "Prøv igjen."); } finally { setBusy(false); } };
  const field = (value: string, change: (v: string) => void, placeholder: string, secret = false) => <TextInput value={value} onChangeText={change} placeholder={placeholder} placeholderTextColor={colors.placeholder} secureTextEntry={secret} autoCapitalize="none" style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginTop: 8 }} />;
  return <View style={{ padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 16 }}><Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>Sjåfører</Text>
    {field(name, setName, "Navn")}{field(email, setEmail, "E-post")}{field(password, setPassword, "Midlertidig passord", true)}
    <TouchableOpacity disabled={busy} onPress={create}><Text style={{ color: colors.primary, paddingVertical: 12 }}>Opprett sjåførkonto</Text></TouchableOpacity>
    {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}
    {workers.map(worker => <View key={worker.id} style={{ paddingVertical: 8 }}><Text style={{ color: colors.text }}>{worker.name} · {worker.email} · {worker.active ? "Aktiv" : "Deaktivert"}</Text><TouchableOpacity onPress={() => setWorkerActive(worker.id, !worker.active).catch(() => Alert.alert("Feil", "Kunne ikke endre tilgang."))}><Text style={{ color: colors.primary, paddingVertical: 5 }}>{worker.active ? "Deaktiver" : "Aktiver"}</Text></TouchableOpacity></View>)}
  </View>;
}
