import {
  collection, doc, getDocFromServer, getDocsFromServer, limit, query, runTransaction, where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const maxRelatedDocuments = 499;

export async function deleteHistoryOrder(orderId: string) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Du må være logget inn.");
  const account = await getDocFromServer(doc(db, "users", uid));
  if (account.data()?.role !== "admin") throw new Error("Bare admin kan slette bestillinger.");

  const orderRef = doc(db, "orderGroups", orderId);
  const initial = (await getDocFromServer(orderRef)).data();
  if (!initial) return;
  if (initial.status !== "delivered" && initial.status !== "cancelled") {
    throw new Error("Bare leverte og kansellerte bestillinger kan slettes.");
  }
  if (typeof initial.customerId !== "string" || !initial.customerId) {
    throw new Error("Bestillingen mangler kunde-ID og må gjennomgås før sletting.");
  }

  const [requests, fees, notices] = await Promise.all([
    getDocsFromServer(query(collection(db, "restaurantRequests"), where("orderGroupId", "==", orderId), limit(maxRelatedDocuments + 1))),
    getDocsFromServer(query(collection(orderRef, "feeHistory"), limit(maxRelatedDocuments + 1))),
    getDocsFromServer(query(collection(db, "users", initial.customerId, "notifications"), where("orderId", "==", orderId), limit(maxRelatedDocuments + 1))),
  ]);
  const related = [...requests.docs, ...fees.docs, ...notices.docs];
  if (related.length > maxRelatedDocuments) throw new Error("Bestillingen har for mange tilknyttede poster til å slettes fra appen.");

  await runTransaction(db, async tx => {
    if (auth.currentUser?.uid !== uid) throw new Error("Du må være logget inn som admin.");
    const current = (await tx.get(orderRef)).data();
    if (!current) return;
    const statusChanged = current.statusUpdatedAt?.toMillis() !== initial.statusUpdatedAt?.toMillis();
    if (current.status !== initial.status || current.customerId !== initial.customerId || statusChanged) {
      throw new Error("Bestillingen er endret. Kontroller den før du prøver igjen.");
    }
    for (const entry of related) tx.delete(entry.ref);
    tx.delete(orderRef);
  });
}
