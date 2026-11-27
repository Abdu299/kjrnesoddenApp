import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import AdminPage from "../components/AdminPage";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { subscribeOrders, type CustomerOrder } from "../services/customerOrders";
import { subscribeWorkers, type WorkerAccount } from "../services/workerService";
import { previousMonth, summarize } from "../services/dashboardMetrics";
export default function AdminDashboard() {
  const { role, user } = useAuth(); const { colors } = useAppTheme();
  const [orders,setOrders]=useState<CustomerOrder[]>([]); const [workers,setWorkers]=useState<WorkerAccount[]>([]); const [error,setError]=useState(""); const [ready,setReady]=useState(false);
  useEffect(()=>{if(role!=="admin"||!user)return;setReady(false);const a=subscribeOrders(true,data=>{setOrders(data);setReady(true);},e=>{setError(e.message);setReady(true);});const b=subscribeWorkers(setWorkers,e=>setError(e.message));return()=>{a();b();};},[role,user?.uid]);
  const summary=useMemo(()=>summarize(orders),[orders]);
  const last=useMemo(()=>summarize(orders,previousMonth(new Date())),[orders]);
  const open=orders.filter(o=>o.status!=="delivered"&&o.status!=="cancelled");
  const unassigned=open.filter(o=>!o.assignedWorkerId); const pending=orders.filter(o=>o.feeProposal?.status==="pending"&&!['delivered','cancelled'].includes(o.status));
  const entries=workers.map(worker=>({worker,stats:summarize(orders.filter(o=>o.assignedWorkerId===worker.id))})).sort((a,b)=>b.stats.revenue-a.stats.revenue);
  const money=(n:number)=>`${n.toLocaleString("nb-NO")} kr`;
  const metric=(title:string,value:string,detail?:string)=><View style={{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:14,padding:15,minWidth:145,flexGrow:1,flexBasis:"45%"}}><Text style={{color:colors.textMuted,fontSize:13}}>{title}</Text><Text style={{color:colors.text,fontSize:21,fontWeight:"800",marginTop:5}}>{value}</Text>{detail&&<Text style={{color:colors.textSecondary,fontSize:12,marginTop:5}}>{detail}</Text>}</View>;
  return <AdminPage title="Oversikt" subtitle="Nøkkeltall for bestillinger og leveringer.">
    {!!error ? <Text style={{color:colors.danger}}>Kunne ikke hente alle tall: {error}</Text> : !ready ? <Text style={{color:colors.textMuted}}>Henter oversikt…</Text> : <>
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:10}}>{metric("Leveringsinntekter",money(summary.revenue),`${summary.completed} leverte oppdrag`)}{metric("Forrige måned",money(last.revenue),`${last.completed} leverte oppdrag`)}{metric("Åpne bestillinger",String(open.length),`${unassigned.length} uten sjåfør`)}{metric("Avventer prisgodkjenning",String(pending.length))}{metric("Kansellerte",String(orders.filter(o=>o.status==='cancelled').length))}{metric("Snitt leveringspris",summary.completed-summary.unknownFees > 0 ? money(Math.round(summary.revenue/(summary.completed-summary.unknownFees))) : "–")}</View>
      <Text style={{color:colors.textMuted,marginTop:14,lineHeight:19}}>Leveringsinntekter er registrerte leveringspriser for leverte oppdrag. Tallene er ikke bekreftet innbetaling eller fortjeneste: lønn og andre kostnader er ikke registrert.{summary.unknownFees?` ${summary.unknownFees} leverte oppdrag mangler pris.`:""}{last.missingDates?` ${last.missingDates} leverte oppdrag mangler dato og er ikke med i månedstallet.`:""}</Text>
      <Text style={{fontSize:19,fontWeight:"800",color:colors.text,marginTop:24,marginBottom:10}}>Per sjåfør</Text>
      {entries.map(({worker,stats})=><View key={worker.id} style={{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:12,marginBottom:8}}><Text style={{color:colors.text,fontWeight:"700"}}>{worker.name}</Text><Text style={{color:colors.textSecondary,marginTop:4}}>{stats.completed} levert · {money(stats.revenue)}{stats.unknownFees?` · ${stats.unknownFees} uten pris`:""}</Text></View>)}
      {!entries.length && <Text style={{color:colors.textMuted}}>Ingen sjåfører registrert.</Text>}
    </>}
  </AdminPage>;
}
