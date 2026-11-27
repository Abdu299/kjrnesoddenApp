import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity } from "react-native";
import { collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { router } from "expo-router";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
export default function NotificationInbox() {
  const {user} = useAuth(); const {colors} = useAppTheme(); const [items,setItems] = useState<any[]>([]); const [error,setError] = useState("");
  useEffect(()=>{ if (!user) return; return onSnapshot(collection(db,"users",user.uid,"notifications"),s=>{setItems(s.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>(b.createdAt?.toMillis?.()??0)-(a.createdAt?.toMillis?.()??0)));setError("");},e=>setError(e.message)); },[user?.uid]);
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}><ScrollView contentContainerStyle={{padding:20}}><Text style={{fontSize:26,fontWeight:"800",color:colors.text}}>Varsler</Text>
    {!!error && <Text style={{color:colors.danger}}>Kunne ikke hente varsler: {error}</Text>}{!items.length && !error && <Text style={{color:colors.textMuted,marginTop:15}}>Ingen varsler ennå.</Text>}
    {items.map(item=><TouchableOpacity key={item.id} onPress={()=>{if(user && !item.read) updateDoc(doc(db,"users",user.uid,"notifications",item.id),{read:true}).catch(()=>{}); router.push({pathname:"/customer-order/[id]",params:{id:item.orderId}});}} style={{padding:14,borderWidth:1,borderColor:colors.border,borderRadius:10,marginTop:10}}><Text style={{color:colors.text,fontWeight:item.read?"400":"800"}}>{item.title}</Text><Text style={{color:colors.textMuted}}>{item.createdAt?.toDate?.().toLocaleString("nb-NO") ?? ""}</Text></TouchableOpacity>)}
  </ScrollView></SafeAreaView>;
}
