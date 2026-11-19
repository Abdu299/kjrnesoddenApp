import { useRef, useState } from "react";
import { Linking, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getAppUpdatePolicyFromServer, saveAppUpdatePolicy } from "../services/appUpdatePolicyService";
import { parseAppUpdatePolicy, type AppPlatform, type AppUpdatePolicy } from "../services/appUpdatePolicy";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";

const platforms: { id: AppPlatform; name: string }[] = [{ id: "ios", name: "iPhone" }, { id: "android", name: "Android" }];

export default function AppUpdatePolicyEditor() {
  const { styles, colors } = useThemedStyles(createStyles);
  const [draft, setDraft] = useState<AppUpdatePolicy | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [message, setMessage] = useState("");
  async function open() {
    if (pending.current) return;
    pending.current = true; setBusy(true); setMessage("");
    try { setDraft(await getAppUpdatePolicyFromServer()); }
    catch { setMessage("Kunne ikke hente innstillingene. Kontroller nettet og Firebase-reglene, og prøv igjen."); }
    finally { pending.current = false; setBusy(false); }
  }
  function change(platform: AppPlatform, key: string, value: string | boolean) {
    if (draft) setDraft({ ...draft, [platform]: { ...draft[platform], [key]: value } });
  }
  function cleanDraft(): AppUpdatePolicy {
    const clean = (platform: AppPlatform) => {
      const rule = draft![platform];
      let storeUrl = rule.storeUrl.trim();
      // Store sharing links often contain language/tracking parameters.
      if (platform === "ios") storeUrl = storeUrl.replace(/[?#].*$/, "");
      else if (storeUrl.startsWith("https://play.google.com/store/apps/details?")) {
        const id = storeUrl.match(/[?&]id=([^&#]+)/)?.[1];
        if (id) storeUrl = `https://play.google.com/store/apps/details?id=${id}`;
      }
      return { ...rule, storeUrl, minimumVersion: rule.minimumVersion.trim() };
    };
    return parseAppUpdatePolicy({ ...draft, ios: clean("ios"), android: clean("android") });
  }
  async function save() {
    if (!draft || pending.current) return;
    pending.current = true; setBusy(true); setMessage("");
    try {
      const policy = cleanDraft();
      await saveAppUpdatePolicy(policy, draft.revision);
      setDraft(null); setMessage("Oppdateringskravene er lagret.");
    } catch (error) {
      setMessage((error as { code?: string }).code ? "Kunne ikke lagre. Kontroller admintilgangen og Firebase-reglene." : (error as Error).message);
    } finally { pending.current = false; setBusy(false); }
  }
  async function preview(platform: AppPlatform) {
    try {
      const rule = cleanDraft()[platform];
      if (!rule.storeUrl) throw new Error("Legg inn en butikklenke først.");
      await Linking.openURL(rule.storeUrl);
    } catch (error) { setMessage((error as Error).message || "Kunne ikke åpne appbutikken."); }
  }
  return <View style={styles.card}>
    <Text style={styles.title}>Appoppdateringer</Text>
    <Text style={styles.description}>Be eldre appversjoner om å oppdatere før de kan brukes videre.</Text>
    {draft ? <>
      <Text style={styles.description}>Aktiver først når den nye versjonen er tilgjengelig i appbutikken. Du kan slå kravet av igjen her via nettversjonen.</Text>
      {platforms.map(({ id, name }) => <View key={id} style={styles.platform}>
        <View style={styles.row}>
          <Text style={styles.label}>{name}</Text>
          <Switch accessibilityLabel={`Krev oppdatering ${name}`} value={draft[id].enabled} disabled={busy}
            onValueChange={(value) => change(id, "enabled", value)} trackColor={{ true: colors.primaryFill }} />
        </View>
        <Text style={styles.description}>Minste tillatte versjon. For eksempel krever 1.0.2 at alle med 1.0.1 oppdaterer.</Text>
        <TextInput accessibilityLabel={`Minste versjon ${name}`} value={draft[id].minimumVersion} editable={!busy}
          placeholder="1.0.2" placeholderTextColor={colors.placeholder} style={styles.input} keyboardType="numbers-and-punctuation"
          autoCapitalize="none" autoCorrect={false} onChangeText={(value) => change(id, "minimumVersion", value)} />
        <Text style={styles.label}>{id === "ios" ? "Lenke til appen i App Store" : "Lenke til appen i Google Play"}</Text>
        <TextInput accessibilityLabel={`Butikklenke ${name}`} value={draft[id].storeUrl} editable={!busy}
          placeholder={id === "ios" ? "https://apps.apple.com/no/app/…/id…" : "https://play.google.com/store/apps/details?id=com.kjornesodden.app"}
          placeholderTextColor={colors.placeholder} style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="url"
          onChangeText={(value) => change(id, "storeUrl", value)} />
        <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => preview(id)} style={styles.secondary}>
          <Text style={styles.secondaryText}>Kontroller lenken til {name}</Text>
        </TouchableOpacity>
      </View>)}
      <View style={styles.row}>
        <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={() => { setDraft(null); setMessage(""); }}>
          <Text style={styles.secondaryText}>Avbryt</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.primary} onPress={save}>
          <Text style={styles.primaryText}>{busy ? "Lagrer…" : "Lagre oppdateringskrav"}</Text>
        </TouchableOpacity>
      </View>
    </> : <TouchableOpacity accessibilityRole="button" disabled={busy} style={styles.secondary} onPress={open}>
      <Text style={styles.secondaryText}>{busy ? "Henter…" : "Administrer appoppdateringer"}</Text>
    </TouchableOpacity>}
    {!!message && <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>}
  </View>;
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 18, borderRadius: 16, marginVertical: 20 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 8 },
  description: { color: colors.textMuted, lineHeight: 21, marginBottom: 12 },
  label: { color: colors.text, fontWeight: "700", marginBottom: 8 },
  platform: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginBottom: 20, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
    paddingHorizontal: 12, color: colors.text, backgroundColor: colors.inputBackground, fontSize: 16 },
  secondary: { minHeight: 44, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.primaryBorder, padding: 12, borderRadius: 10 },
  secondaryText: { color: colors.primary, fontWeight: "700" },
  primary: { minHeight: 44, justifyContent: "center", backgroundColor: colors.primaryFill, padding: 12, borderRadius: 10 },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  message: { color: colors.text, lineHeight: 21, marginTop: 12 },
});
