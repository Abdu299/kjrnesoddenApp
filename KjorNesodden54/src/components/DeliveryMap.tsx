import { useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";

export type Coordinates = { latitude: number; longitude: number };
export default function DeliveryMap({ value, onChange }: { value: Coordinates | null; onChange: (v: Coordinates) => void }) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState<Coordinates | null>(value);
  const [region, setRegion] = useState({ ...(value ?? { latitude: 59.83, longitude: 10.66 }), latitudeDelta: 0.15, longitudeDelta: 0.15 });
  const current = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { Alert.alert("Posisjon er ikke tilgjengelig", "Du kan fortsatt velge et punkt på kartet."); return; }
      const pos = await Location.getCurrentPositionAsync({});
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setPoint(coords); setRegion({ ...coords, latitudeDelta: 0.015, longitudeDelta: 0.015 });
    } catch { Alert.alert("Kunne ikke finne posisjonen", "Velg et punkt på kartet i stedet."); }
  };
  return <View><TouchableOpacity onPress={() => { setPoint(value); setOpen(true); }} accessibilityRole="button"><Text style={{ color: "#146CC0", paddingVertical: 12, fontWeight: "700" }}>{value ? "Endre punkt på kartet" : "Velg leveringspunkt på kartet"}</Text></TouchableOpacity>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, paddingTop: 50, backgroundColor: "white" }}><Text style={{ padding: 12 }}>Trykk på kartet for å velge leveringspunkt.</Text>
        <MapView style={{ flex: 1 }} region={region} onRegionChangeComplete={setRegion} onPress={(e) => setPoint(e.nativeEvent.coordinate)}>
          {point && <Marker coordinate={point} draggable onDragEnd={(e) => setPoint(e.nativeEvent.coordinate)} />}
        </MapView>
        <TouchableOpacity onPress={current}><Text style={{ padding: 16, color: "#146CC0" }}>Bruk min nåværende posisjon</Text></TouchableOpacity>
        <TouchableOpacity disabled={!point} onPress={() => { if (point) onChange(point); setOpen(false); }}><Text style={{ padding: 16, color: point ? "#146CC0" : "#777" }}>Bekreft punkt</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setOpen(false)}><Text style={{ padding: 16, color: "#146CC0" }}>Avbryt</Text></TouchableOpacity>
      </View>
    </Modal>
  </View>;
}
