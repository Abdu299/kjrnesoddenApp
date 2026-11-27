import { collection, doc, getDocsFromServer, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function cancelCustomerRequest(orderId: string, reason: string, actor: "worker" | "admin" = "admin") {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Du må være logget inn.");
  const cleanReason = reason.trim();
  if (!cleanReason || cleanReason.length > 500) throw new Error("Skriv en grunn på 1–500 tegn.");
  const refs = await getDocsFromServer(query(collection(db, "restaurantRequests"), where("orderGroupId", "==", orderId)));
  if (refs.size > 100) throw new Error("Bestillingen har for mange restaurantforespørsler til å kanselleres i appen.");
  const orderRef = doc(db, "orderGroups", orderId);
  await runTransaction(db, async tx => {
    const [order, account, ...requests] = await Promise.all([
      tx.get(orderRef), tx.get(doc(db, "users", uid)), ...refs.docs.map(item => tx.get(item.ref)),
    ]);
    const profile = account.data();
    if (auth.currentUser?.uid !== uid || profile?.role !== actor) throw new Error("Du har ikke tilgang til å kansellere bestillingen.");
    if (!order.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = order.data();
    if (actor === "worker" && (profile.active !== true || data.assignedWorkerId !== uid || data.assignmentStatus !== "assigned")) {
      throw new Error("Oppdraget er ikke lenger tildelt deg.");
    }
    if (data.status === "cancelled") return;
    if (data.status === "delivered") throw new Error("Bestillingen er allerede levert.");

    tx.update(orderRef, {
      status: "cancelled", statusUpdatedAt: serverTimestamp(),
      cancellation: {
        reason: cleanReason, by: uid, role: actor,
        name: profile.name ?? uid, at: serverTimestamp(),
      },
    });
    for (const request of requests) {
      if (request.exists() && request.data().orderGroupId === orderId && request.data().status === "pending") {
        tx.update(request.ref, { status: "cancelled", cancelledAt: serverTimestamp() });
      }
    }
    tx.set(doc(collection(db, "users", data.customerId, "notifications")), {
      title: "Bestillingen er kansellert", orderId, createdAt: serverTimestamp(),
      read: false, pushState: "pending", event: "cancelled",
    });
  });
}
