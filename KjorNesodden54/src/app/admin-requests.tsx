import { useEffect, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import AdminPage from "../components/AdminPage";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { ORDER_STAGE_LABELS, subscribeOrders, type CustomerOrder } from "../services/customerOrders";
import { cancelCustomerRequest } from "../services/adminRequestService";
export default function AdminRequests() {
  const { role, user } = useAuth(); const { colors } = useAppTheme();
  const [orders, setOrders] = useState<CustomerOrder[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState("");
  useEffect(() => { if (role !== "admin" || !user) return; setLoading(true); return subscribeOrders(true, value => {setOrders(value);setError("");setLoading(false);}, e => {setError(e.message);setLoading(false);}); }, [role, user?.uid]);
  const cancel = (order: CustomerOrder) => { const id = order.id; const underway = ["picked_up", "on_the_way"].includes(order.status); Alert.alert("Kanseller forespørsel?", `Forespørselen fjernes fra den åpne listen og lagres som kansellert i historikken. Kunden får et varsel.${underway ? " Bestillingen kan allerede være hentet – kontakt sjåføren direkte." : ""}`, [{text:"Avbryt",style:"cancel"},{text:"Kanseller forespørsel",style:"destructive",onPress:async()=>{try{setBusy(id);await cancelCustomerRequest(id);}catch(e){Alert.alert("Kunne ikke kansellere",e instanceof Error?e.message:"Prøv igjen.");}finally{setBusy("");}}}]); };
  const open = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  return <AdminPage title="Åpne forespørsler" subtitle="Bestillinger som ikke er fullført. Kansellerte forespørsler beholdes i historikken.">
    {!!error && <Text style={{color:colors.danger}}>Kunne ikke hente forespørsler: {error}</Text>}
    {loading ? <Text style={{color:colors.textMuted}}>Henter forespørsler…</Text> : !error && !open.length ? <Text style={{color:colors.textMuted}}>Ingen åpne forespørsler.</Text> : null}
    {open.map(order => <View key={order.id} style={{borderWidth:1,borderColor:colors.border,borderRadius:14,padding:16,marginBottom:12,backgroundColor:colors.surface}}>
      <Text style={{color:colors.text,fontSize:17,fontWeight:"800"}}>{order.customerName || "Kunde"}</Text>
      <Text style={{color:colors.textMuted,marginTop:4}}>#{order.id.slice(-6)} · {ORDER_STAGE_LABELS[order.status] ?? order.status}</Text>
      <Text style={{color:colors.textSecondary,marginTop:8}}>{order.address}</Text>
      {(order.items ?? []).map((item,index)=><Text key={index} style={{color:colors.text,marginTop:6}}>{item.quantity} × {item.productName} · {item.restaurantName}{item.customRequest ? `\n${item.customRequest}` : ""}</Text>)}
      <Text style={{color:colors.textSecondary,marginTop:8}}>Varer: {order.totalPrice} kr · Levering: {order.deliveryFee == null ? "avtales" : `${order.deliveryFee} kr`}</Text>
      <TouchableOpacity disabled={!!busy} onPress={()=>cancel(order)} style={{alignSelf:"flex-start",paddingVertical:10}}><Text style={{color:colors.danger,fontWeight:"700"}}>{busy===order.id ? "Kansellerer…" : "Kanseller forespørsel"}</Text></TouchableOpacity>
    </View>)}
  </AdminPage>;
}
