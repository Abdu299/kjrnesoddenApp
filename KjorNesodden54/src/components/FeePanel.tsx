import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { proposeFee, respondFee, type FeeProposal } from "../services/feeService";
export default function FeePanel({ orderId, fee, proposal, canPropose, isCustomer }: { orderId: string; fee: number | null; proposal?: FeeProposal | null; canPropose: boolean; isCustomer: boolean }) {
  const { colors } = useAppTheme(); const [amount,setAmount] = useState(""); const [reason,setReason] = useState(""); const [busy,setBusy] = useState(false); const [editing,setEditing] = useState(false);
  const run = async (action: () => Promise<void>) => { try { setBusy(true); await action(); setEditing(false); setAmount(""); setReason(""); } catch(e) { Alert.alert("Kunne ikke oppdatere prisen", e instanceof Error ? e.message : "Prøv igjen."); } finally { setBusy(false); } };
  const button = (label: string, action: () => void) => <TouchableOpacity disabled={busy} onPress={action} style={{paddingVertical:8}}><Text style={{color:colors.primary,fontWeight:"700"}}>{label}</Text></TouchableOpacity>;
  return <View style={{ marginTop: 8 }}>
    {proposal && <Text style={{color:colors.text}}>Prisforslag: {proposal.proposedFee} kr · {proposal.status === "pending" ? "Venter på svar" : proposal.status === "approved" ? "Godkjent" : "Avslått"}{"\n"}Begrunnelse: {proposal.reason}</Text>}
    {fee == null && !proposal && <Text style={{color:colors.textSecondary}}>Leveringsprisen må avtales før henting.</Text>}
    {proposal?.status === "pending" && isCustomer && <>{button("Godkjenn pris", () => Alert.alert("Godkjenn leveringspris", `Godkjenner du ${proposal.proposedFee} kr i levering?`, [{text:"Avbryt",style:"cancel"},{text:"Godkjenn",onPress:()=>run(()=>respondFee(orderId,proposal.id,true))}]))}{button("Avslå pris",()=>run(()=>respondFee(orderId,proposal.id,false)))}</>}
    {canPropose && proposal?.status !== "pending" && !editing && button("Foreslå leveringspris",()=>setEditing(true))}
    {canPropose && editing && <><TextInput keyboardType="number-pad" placeholder="Pris i kroner" placeholderTextColor={colors.placeholder} value={amount} onChangeText={setAmount} style={{borderWidth:1,borderColor:colors.border,color:colors.text,padding:8,marginTop:8}} /><TextInput placeholder="Begrunnelse" placeholderTextColor={colors.placeholder} value={reason} onChangeText={setReason} style={{borderWidth:1,borderColor:colors.border,color:colors.text,padding:8,marginTop:8}} />{button("Send prisforslag",()=>{if (!/^\d+$/.test(amount)) { Alert.alert("Ugyldig pris", "Skriv inn hele kroner."); return; } run(()=>proposeFee(orderId,Number(amount),reason));})}{button("Avbryt",()=>setEditing(false))}</>}
  </View>;
}
