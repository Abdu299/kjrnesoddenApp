import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp, where, type Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export const ORDER_STAGES = ["placed", "confirmed", "preparing", "ready", "picked_up", "on_the_way", "delivered", "cancelled"] as const;
export type OrderStage = typeof ORDER_STAGES[number];
export const ORDER_STAGE_LABELS: Record<OrderStage, string> = {
  placed: "Mottatt", confirmed: "Bekreftet", preparing: "Tilberedes", ready: "Klar for henting",
  picked_up: "Hentet", on_the_way: "På vei", delivered: "Levert", cancelled: "Kansellert",
};
export type CustomerOrder = {
  feeProposal?: import("./feeService").FeeProposal | null;
  assignmentStatus?: "available" | "assigned" | "completed"; assignedWorkerId?: string | null;
  id: string; customerId: string; customerName: string; customerPhone?: string; address: string;
  completedAt?: Timestamp | null;
  coordinates: { latitude: number; longitude: number } | null;
  items: { restaurantId?: string; type?: "restaurant" | "custom"; productName: string; restaurantName: string; quantity: number; price: number; customRequest: string }[];
  totalPrice: number; deliveryFee: number | null; status: OrderStage; createdAt: Timestamp | null;
};
export function subscribeOrders(admin: boolean, onChange: (orders: CustomerOrder[]) => void, onError: (error: Error) => void) {
  const uid = auth.currentUser?.uid;
  if (!uid) { onError(new Error("Du må være logget inn.")); return () => {}; }
  const ref = collection(db, "orderGroups");
  const q = admin ? query(ref) : query(ref, where("customerId", "==", uid));
  return onSnapshot(q, snapshot => {
    const orders = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as CustomerOrder));
    orders.sort((a,b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
    onChange(orders);
  }, onError);
}
export async function updateOrderStage(id: string, status: OrderStage) {
  if (!ORDER_STAGES.includes(status)) throw new Error("Ugyldig status.");
  const messages: Partial<Record<OrderStage,string>> = { confirmed: "Bestillingen er bekreftet", cancelled: "Bestillingen er kansellert", picked_up: "Bestillingen er hentet", on_the_way: "Bestillingen er på vei", delivered: "Bestillingen er levert" };
  await runTransaction(db, async tx => { const ref = doc(db, "orderGroups", id), snap = await tx.get(ref); if (!snap.exists()) throw new Error("Bestillingen finnes ikke."); const old = snap.data(); if (old.status === status) return;
    tx.update(ref, { status, statusUpdatedAt: serverTimestamp() });
    if (messages[status]) tx.set(doc(collection(db, "users", old.customerId, "notifications")), { title: messages[status], orderId: id, createdAt: serverTimestamp(), read: false, pushState: "pending", event: status });
  });
}
