import type { ReactNode } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
export default function AdminPage({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { role, loading } = useAuth(); const { colors } = useAppTheme();
  return <SafeAreaView style={{flex:1,backgroundColor:colors.background}}><ScrollView contentContainerStyle={{padding:20,paddingBottom:48}} keyboardShouldPersistTaps="handled">
    <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" style={{paddingVertical:8}}><Text style={{color:colors.primary,fontWeight:"700"}}>‹ Tilbake</Text></TouchableOpacity>
    <Text style={{color:colors.text,fontSize:26,fontWeight:"800",marginTop:8}}>{title}</Text>
    {subtitle && <Text style={{color:colors.textSecondary,marginVertical:10,lineHeight:20}}>{subtitle}</Text>}
    {loading ? <ActivityIndicator color={colors.primary} /> : role === "admin" ? <View style={{marginTop:12}}>{children}</View> : <Text style={{color:colors.danger,marginTop:16}}>Du må være logget inn som administrator.</Text>}
  </ScrollView></SafeAreaView>;
}
