import { useEffect, useState } from "react";
import { router } from "expo-router";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { useWorkerLocation } from "../context/WorkerLocationContext";
import { subscribeWorkerOrders, type WorkerOrder } from "../services/workerService";

export default function WorkerHome() {
  const { user, role } = useAuth(); const { colors } = useAppTheme(); const location = useWorkerLocation();
  const [available, setAvailable] = useState<WorkerOrder[]>([]); const [mine, setMine] = useState<WorkerOrder[]>([]); const [error, setError] = useState("");
  useEffect(() => { if (!user || role !== "worker") return; const a = subscribeWorkerOrders(user.uid, "available", setAvailable, e => setError(e.message)); const b = subscribeWorkerOrders(user.uid, "mine", setMine, e => setError(e.message)); return () => { a(); b(); }; }, [user?.uid, role]);
  const open = available.filter(o => !["cancelled", "delivered"].includes(o.status)).length;
  const active = mine.filter(o => o.assignmentStatus === "assigned" && !["cancelled", "delivered"].includes(o.status)).length;
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}><ScrollView contentContainerStyle={{padding:20}}>
    <Text style={{fontSize:27,fontWeight:"800",color:colors.text}}>Sjåfør • Oversikt</Text>
    <Text style={{color:colors.textSecondary,marginTop:8}}>Her ser du status for arbeidsdagen din.</Text>
    <View style={{flexDirection:"row",gap:12,marginTop:24}}>{[["Ledige oppdrag",open],["Dine aktive",active]].map(([label,count]) => <View key={label} style={{flex:1,padding:18,borderWidth:1,borderColor:colors.border,borderRadius:14}}><Text style={{color:colors.primary,fontSize:27,fontWeight:"800"}}>{count}</Text><Text style={{color:colors.text}}>{label}</Text></View>)}</View>
    <Text style={{color:colors.text,marginTop:24,fontWeight:"700"}}>Din posisjon</Text><Text style={{color:colors.textSecondary,marginTop:6}}>{location.message}. Oppdateres mens appen er åpen.</Text>
    {!!error && <Text style={{color:colors.danger,marginTop:12}}>Kunne ikke hente oppdrag: {error}</Text>}
    <TouchableOpacity onPress={() => router.push("/worker-orders")} style={{backgroundColor:colors.primary,padding:15,borderRadius:12,marginTop:24}}><Text style={{color:colors.onPrimary,fontWeight:"700",textAlign:"center"}}>Se alle oppdrag</Text></TouchableOpacity>
  </ScrollView></SafeAreaView>;
}
