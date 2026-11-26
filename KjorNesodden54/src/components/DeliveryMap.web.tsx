import { Text } from "react-native";
type Coordinates = { latitude: number; longitude: number };
export default function DeliveryMap(_props: { value: Coordinates | null; onChange: (v: Coordinates) => void }) {
  return <Text>Du kan skrive adressen manuelt. Kartvalg er tilgjengelig i mobilappen.</Text>;
}
