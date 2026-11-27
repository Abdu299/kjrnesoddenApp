import { collection, doc, getDocsFromServer, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "./firebase";
/** Cancel the parent and its pending restaurant requests atomically. */
export async function cancelCustomerRequest(orderId: string) {
  const uid = auth.currentUser?.uid; if (!uid) throw new Error("Du må være logget inn.");
  const refs = await getDocsFromServer(query(collection(db, "restaurantRequests"), where("orderGroupId", "==", orderId)));
  if (refs.size > 100) throw new Error("Bestillingen har for mange restaurantforespørsler til å kanselleres i appen.");
  const orderRef = doc(db, "orderGroups", orderId), adminRef = doc(db, "users", uid);
  await runTransaction(db, async tx => {
    const [order, admin, ...requests] = await Promise.all([tx.get(orderRef), tx.get(adminRef), ...refs.docs.map(item => tx.get(item.ref))]);
    if (!admin.exists() || admin.data().role !== "admin" || auth.currentUser?.uid !== uid) throw new Error("Du har ikke administratortilgang.");
    if (!order.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = order.data(); if (data.status === "cancelled") return;
    if (data.status === "delivered") throw new Error("Bestillingen er allerede levert.");
    tx.update(orderRef, { status: "cancelled", statusUpdatedAt: serverTimestamp() });
    requests.forEach(request => { if (request.exists() && request.data().orderGroupId === orderId && request.data().status === "pending") tx.update(request.ref, { status: "cancelled", cancelledAt: serverTimestamp() }); });
    tx.set(doc(collection(db, "users", data.customerId, "notifications")), { title: "Bestillingen er kansellert", orderId, createdAt: serverTimestamp(), read: false, pushState: "pending", event: "cancelled" });
  });
}
