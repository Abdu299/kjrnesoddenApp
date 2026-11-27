import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import type { CustomerOrder } from "../services/customerOrders";

export function OrderCancellation({ order, showActor = true }: { order: CustomerOrder; showActor?: boolean }) {
  const { colors } = useAppTheme();
  if (order.status !== "cancelled") return null;
  const info = order.cancellation;
  const actor = info ? `${info.name} (${info.role === "worker" ? "sjåfør" : "admin"})` : "Ikke registrert";
  return <View style={{ padding: 12, gap: 5, borderRadius: 10, backgroundColor: colors.dangerSoft }}>
    <Text style={{ color: colors.danger, fontWeight: "800" }}>Bestillingen er kansellert</Text>
    {showActor && <Text style={{ color: colors.text }}>Kansellert av: {actor}</Text>}
    <Text style={{ color: colors.text }}>Grunn: {info?.reason || "Ikke registrert"}</Text>
    {info?.at && <Text style={{ color: colors.textMuted }}>{info.at.toDate().toLocaleString("nb-NO")}</Text>}
  </View>;
}

export function CancelOrderForm({ busy, onCancel }: { busy: boolean; onCancel: (reason: string) => Promise<void> }) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) return <Pressable accessibilityRole="button" disabled={busy} onPress={() => setOpen(true)} style={{ paddingVertical: 10 }}>
    <Text style={{ color: colors.danger, fontWeight: "700" }}>Kanseller bestilling</Text>
  </Pressable>;
  return <View style={{ gap: 8, padding: 12, borderRadius: 10, backgroundColor: colors.dangerSoft }}>
    <Text style={{ color: colors.text, fontWeight: "700" }}>Hvorfor kansellerer du?</Text>
    <TextInput accessibilityLabel="Grunn til kansellering" multiline maxLength={500} value={reason} onChangeText={setReason}
      editable={!busy} placeholder="Skriv grunnen her" placeholderTextColor={colors.placeholder}
      style={{ minHeight: 64, padding: 10, color: colors.text, backgroundColor: colors.background, borderRadius: 8 }} />
    <Text style={{ color: colors.textSecondary }}>Grunnen lagres på bestillingen, og kunden varsles.</Text>
    <View style={{ flexDirection: "row", gap: 16, flexWrap: "wrap" }}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setReason(""); setOpen(false); }} style={{ paddingVertical: 8 }}>
        <Text style={{ color: colors.primary }}>Avbryt</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={busy || !reason.trim()} onPress={() => void onCancel(reason)} style={{ paddingVertical: 8, opacity: busy || !reason.trim() ? 0.5 : 1 }}>
        <Text style={{ color: colors.danger, fontWeight: "800" }}>{busy ? "Kansellerer …" : "Bekreft kansellering"}</Text>
      </Pressable>
    </View>
  </View>;
}
