import { useEffect, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import AdminPage from "../components/AdminPage";
import WorkerManagement from "../components/WorkerManagement";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { ORDER_STAGE_LABELS, subscribeOrders, type CustomerOrder } from "../services/customerOrders";
import type { WorkerAccount } from "../services/workerService";

export default function AdminWorkers() {
  const { role, user } = useAuth(); const { colors } = useAppTheme();
  const [selected, setSelected] = useState<WorkerAccount | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]); const [error, setError] = useState(""); const [loaded, setLoaded] = useState(false);
  useEffect(() => { if (role !== "admin" || !user) return; setLoaded(false); return subscribeOrders(true, value => { setOrders(value); setError(""); setLoaded(true); }, e => { setError(e.message); setLoaded(true); }); }, [role, user?.uid]);
  const assigned = useMemo(() => orders.filter(o => o.assignedWorkerId === selected?.id), [orders, selected?.id]);
  const completed = assigned.filter(o => o.status === "delivered");
  const active = assigned.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const unknown = completed.filter(o => typeof o.deliveryFee !== "number" || !Number.isFinite(o.deliveryFee)).length;
  const revenue = completed.reduce((sum, o) => sum + (typeof o.deliveryFee === "number" && Number.isFinite(o.deliveryFee) ? o.deliveryFee : 0), 0);
  const metric = (label: string, value: string) => <View style={{flexGrow:1,minWidth:95,backgroundColor:colors.surfaceMuted,padding:14,borderRadius:12}}><Text style={{color:colors.textMuted,fontSize:12}}>{label}</Text><Text style={{color:colors.text,fontSize:20,fontWeight:"800",marginTop:4}}>{value}</Text></View>;
  return <AdminPage title="Sjåfører" subtitle={selected ? "Sjåførinformasjon og oppdrag" : "Opprett kontoer og se oppdrag per sjåfør."}>
    {!selected ? <WorkerManagement onSelect={setSelected} /> : <>
      <TouchableOpacity onPress={() => setSelected(null)} style={{paddingVertical:10}}><Text style={{color:colors.primary,fontWeight:"700"}}>‹ Alle sjåfører</Text></TouchableOpacity>
      <View style={{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:16,padding:16,marginBottom:14}}>
        <Text style={{color:colors.text,fontSize:21,fontWeight:"800"}}>{selected.name}</Text><Text style={{color:colors.textSecondary,marginTop:5}}>{selected.email}</Text><Text style={{color:selected.active ? colors.success : colors.danger,marginTop:6,fontWeight:"700"}}>{selected.active ? "Aktiv" : "Deaktivert"}</Text>
      </View>
      {!!error ? <Text style={{color:colors.danger}}>Kunne ikke hente oppdrag: {error}</Text> : !loaded ? <Text style={{color:colors.textMuted}}>Henter oppdrag…</Text> : <>
        <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{metric("Fullført",String(completed.length))}{metric("Aktive",String(active.length))}{metric("Leveringsinntekter",`${revenue.toLocaleString("nb-NO")} kr`)}</View>
        <Text style={{color:colors.textMuted,lineHeight:19,marginTop:10}}>Summen er registrerte leveringspriser for leverte oppdrag, ikke bekreftet innbetaling eller fortjeneste. Utgifter og lønn er ikke registrert.{unknown ? ` ${unknown} leverte oppdrag mangler leveringspris og er ikke med i summen.` : ""}</Text>
        <Text style={{color:colors.text,fontSize:19,fontWeight:"800",marginTop:22,marginBottom:10}}>Oppdragshistorikk</Text>
        {assigned.length === 0 && <Text style={{color:colors.textMuted}}>Ingen registrerte oppdrag for denne sjåføren.</Text>}
        {assigned.map(order => <View key={order.id} style={{borderWidth:1,borderColor:colors.border,borderRadius:12,padding:14,marginBottom:10}}><Text style={{color:colors.text,fontWeight:"700"}}>{order.customerName} · #{order.id.slice(-6)}</Text><Text style={{color:colors.textSecondary,marginTop:5}}>{ORDER_STAGE_LABELS[order.status] ?? order.status} · {order.completedAt?.toDate?.().toLocaleString("nb-NO") ?? order.createdAt?.toDate?.().toLocaleString("nb-NO") ?? "Dato mangler"}</Text><Text style={{color:colors.textSecondary,marginTop:5}}>{order.address} · Levering: {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text></View>)}
      </>}
    </>}
  </AdminPage>;
}
