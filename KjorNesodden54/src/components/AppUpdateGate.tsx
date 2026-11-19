import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, AppState, Linking, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getInstalledRelease } from "../services/appVersion";
import { requiredAppUpdate, type AppUpdatePolicy } from "../services/appUpdatePolicy";
import { getAppUpdatePolicyFromServer, subscribeToAppUpdatePolicy } from "../services/appUpdatePolicyService";
import { useThemedStyles } from "../context/ThemeContext";
import type { AppThemeColors } from "../constants/app-theme";

export default function AppUpdateGate({ children }: { children: ReactNode }) {
  const { styles, colors } = useThemedStyles(createStyles);
  const [release] = useState(getInstalledRelease);
  const [policy, setPolicy] = useState<AppUpdatePolicy | null>(null);
  const [checking, setChecking] = useState(!!release);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = useRef<() => void>(() => {});

  useEffect(() => {
    if (!release) return;
    let active = true;
    let sequence = 0;
    const apply = (next: AppUpdatePolicy) => {
      if (!active) return;
      setPolicy((previous) => previous && previous.revision > next.revision ? previous : next);
      setChecking(false);
      setMessage("");
    };
    const check = async () => {
      const request = ++sequence;
      try { apply(await getAppUpdatePolicyFromServer()); }
      catch {
        if (active && request === sequence) setMessage("Kunne ikke kontrollere versjonen. Kontroller nettet og prøv igjen.");
      } finally {
        if (active && request === sequence) setChecking(false);
      }
    };
    refresh.current = () => { setChecking(true); void check(); };
    // Network problems must not leave the whole app stuck on its loading screen.
    const timeout = setTimeout(() => { if (active) setChecking(false); }, 5000);
    const unsubscribe = subscribeToAppUpdatePolicy(apply, () => { if (active) setChecking(false); });
    const listener = AppState.addEventListener("change", (state) => { if (state === "active") void check(); });
    void check();
    return () => { active = false; clearTimeout(timeout); unsubscribe(); listener.remove(); refresh.current = () => {}; };
  }, [release]);

  const update = release && policy ? requiredAppUpdate(policy, release.platform, release.version) : null;
  if (update && release) {
    const openStore = async () => {
      if (opening) return;
      setOpening(true); setMessage("");
      try { await Linking.openURL(update.storeUrl); }
      catch { setMessage("Kunne ikke åpne appbutikken. Prøv igjen, eller søk etter KjørNesodden i appbutikken."); }
      finally { setOpening(false); }
    };
    return <SafeAreaView style={styles.screen} testID="app-update-required">
      <View style={styles.content}>
        <Text style={styles.brand}>KjørNesodden</Text>
        <Text style={styles.title} accessibilityRole="header">Oppdater appen</Text>
        <Text style={styles.description}>En ny versjon er tilgjengelig. Oppdater KjørNesodden for å fortsette.</Text>
        <Text style={styles.version}>Din versjon: {release.version} · Krever {update.minimumVersion} eller nyere</Text>
        <TouchableOpacity accessibilityRole="button" style={styles.primary} disabled={opening} onPress={openStore}>
          <Text style={styles.primaryText}>{opening ? "Åpner…" : release.platform === "ios" ? "Oppdater i App Store" : "Oppdater i Google Play"}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" style={styles.retry} disabled={checking} onPress={() => refresh.current()}>
          <Text style={styles.retryText}>{checking ? "Kontrollerer…" : "Kontroller igjen"}</Text>
        </TouchableOpacity>
        {!!message && <Text style={styles.description} accessibilityLiveRegion="polite">{message}</Text>}
      </View>
    </SafeAreaView>;
  }
  if (checking) return <View style={styles.loading}>
    <ActivityIndicator color={colors.primary} accessibilityLabel="Ser etter appoppdateringer" />
  </View>;
  return children;
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, justifyContent: "center" },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", padding: 28 },
  brand: { color: colors.primary, fontSize: 22, fontWeight: "800", marginBottom: 36 },
  title: { color: colors.text, fontSize: 30, fontWeight: "800", marginBottom: 16 },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 25, marginBottom: 20 },
  version: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 24 },
  primary: { minHeight: 52, borderRadius: 12, backgroundColor: colors.primaryFill, padding: 14, justifyContent: "center", alignItems: "center" },
  primaryText: { color: colors.onPrimary, fontSize: 16, fontWeight: "700" },
  retry: { minHeight: 48, justifyContent: "center", alignItems: "center", marginTop: 12 },
  retryText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
  loading: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
});
