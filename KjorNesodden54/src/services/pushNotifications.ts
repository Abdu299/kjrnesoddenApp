import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner:true, shouldShowList:true, shouldPlaySound:true, shouldSetBadge:false }) });
let currentToken: string | null = null;
export async function registerOrderPush(uid: string) {
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("default", { name:"Bestillinger", importance:Notifications.AndroidImportance.HIGH });
  const permissions = await Notifications.getPermissionsAsync();
  const status = permissions.granted ? permissions : await Notifications.requestPermissionsAsync();
  if (!status.granted) return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error("EAS-prosjektet er ikke konfigurert.");
  const token = (await Notifications.getExpoPushTokenAsync({projectId})).data;
  if (auth.currentUser?.uid !== uid) return;
  await setDoc(doc(db,"users",uid,"pushTokens",token),{token,updatedAt:serverTimestamp()}); currentToken = token;
}
export async function unregisterOrderPush() {
  const uid = auth.currentUser?.uid; const token = currentToken;
  if (uid && token) await deleteDoc(doc(db,"users",uid,"pushTokens",token));
  currentToken = null;
}
export function listenForOrderPush(open: (id: string) => void) {
  const handle = (response: Notifications.NotificationResponse | null) => { const id = response?.notification.request.content.data?.orderId; if (typeof id === 'string') open(id); };
  const subscription = Notifications.addNotificationResponseReceivedListener(handle);
  Notifications.getLastNotificationResponseAsync().then(handle).catch(() => {});
  return () => subscription.remove();
}
