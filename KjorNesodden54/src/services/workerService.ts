import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, initializeAuth, inMemoryPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";
import type { CustomerOrder, OrderStage } from "./customerOrders";

export type WorkerOrder = CustomerOrder & { assignmentStatus: "available" | "assigned" | "completed"; assignedWorkerId: string | null };
export type WorkerAccount = { id: string; name: string; email: string; active: boolean };

export async function createWorkerAccount(name: string, email: string, password: string) {
  const admin = auth.currentUser;
  if (!admin) throw new Error("Du må være logget inn som admin.");
  const cleanName = name.trim(); const cleanEmail = email.trim().toLowerCase();
  if (cleanName.length < 2 || !cleanEmail.includes("@") || password.length < 6) throw new Error("Oppgi navn, e-post og passord på minst 6 tegn.");
  const app = initializeApp(firebaseConfig, `worker-${Date.now()}-${Math.random()}`);
  const secondary = initializeAuth(app, { persistence: inMemoryPersistence });
  try {
    let credential;
    try { credential = await createUserWithEmailAndPassword(secondary, cleanEmail, password); }
    catch (e) {
      if ((e as { code?: string }).code !== "auth/email-already-in-use") throw e;
      try { credential = await signInWithEmailAndPassword(secondary, cleanEmail, password); }
      catch { throw new Error("E-posten er i bruk. Ved avbrutt opprettelse må du bruke samme passord."); }
    }
    const workerRef = doc(db, "users", credential.user.uid);
    await runTransaction(db, async transaction => {
      const [adminDoc, workerDoc] = await Promise.all([transaction.get(doc(db, "users", admin.uid)), transaction.get(workerRef)]);
      if (auth.currentUser?.uid !== admin.uid || !adminDoc.exists() || adminDoc.data().role !== "admin") throw new Error("Admin-tilgangen er endret.");
      if (workerDoc.exists()) {
        if (workerDoc.data().role === "worker" && workerDoc.data().email === cleanEmail) return;
        throw new Error("Kontoen er allerede i bruk. Ingen konto ble endret.");
      }
      transaction.set(workerRef, { role: "worker", name: cleanName, email: cleanEmail, active: true, createdAt: serverTimestamp() });
    });
  } finally { await signOut(secondary).catch(() => {}); await deleteApp(app).catch(() => {}); }
}
export function subscribeWorkers(onChange: (workers: WorkerAccount[]) => void, onError: (error: Error) => void) {
  return onSnapshot(query(collection(db, "users"), where("role", "==", "worker")), s => onChange(s.docs.map(d => ({ id: d.id, ...d.data() } as WorkerAccount))), onError);
}
export async function setWorkerActive(id: string, active: boolean) { await updateDoc(doc(db, "users", id), { active }); }

export function subscribeWorkerOrders(uid: string, type: "available" | "mine", onChange: (orders: WorkerOrder[]) => void, onError: (error: Error) => void) {
  const ref = collection(db, "orderGroups");
  const q = type === "available" ? query(ref, where("assignmentStatus", "==", "available")) : query(ref, where("assignedWorkerId", "==", uid));
  return onSnapshot(q, s => onChange(s.docs.map(d => ({ id: d.id, ...d.data() } as WorkerOrder)).sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))), onError);
}
export async function takeOrder(id: string) {
  const uid = auth.currentUser?.uid; if (!uid) throw new Error("Logg inn på nytt.");
  await runTransaction(db, async transaction => {
    const ref = doc(db, "orderGroups", id); const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = snap.data();
    if (data.assignedWorkerId === uid && data.assignmentStatus === "assigned") return;
    if (data.assignmentStatus !== "available" || data.assignedWorkerId != null || ["delivered", "cancelled"].includes(data.status)) throw new Error("Oppdraget er ikke lenger ledig.");
    transaction.update(ref, { assignmentStatus: "assigned", assignedWorkerId: uid, assignedAt: serverTimestamp() });
    transaction.set(doc(collection(db, "users", data.customerId, "notifications")), { title: "En sjåfør har tatt oppdraget", orderId: id, createdAt: serverTimestamp(), read: false, pushState: "pending", event: "assigned" });
  });
}
export async function advanceDelivery(id: string, next: OrderStage) {
  const uid = auth.currentUser?.uid; if (!uid) throw new Error("Logg inn på nytt.");
  const previous: Partial<Record<OrderStage, OrderStage>> = { picked_up: "ready", on_the_way: "picked_up", delivered: "on_the_way" };
  if (!previous[next]) throw new Error("Ugyldig status.");
  await runTransaction(db, async transaction => {
    const ref = doc(db, "orderGroups", id); const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = snap.data();
    if (data.assignedWorkerId !== uid) throw new Error("Oppdraget er ikke tildelt deg.");
    if (data.status === next) return;
    if (data.assignmentStatus !== "assigned" || data.status !== previous[next]) throw new Error("Statusen er endret. Oppdater oppdraget.");
    transaction.update(ref, { status: next, statusUpdatedAt: serverTimestamp(), ...(next === "delivered" ? { assignmentStatus: "completed", completedAt: serverTimestamp() } : {}) });
    const titles = { picked_up: "Bestillingen er hentet", on_the_way: "Bestillingen er på vei", delivered: "Bestillingen er levert" };
    transaction.set(doc(collection(db, "users", data.customerId, "notifications")), { title: titles[next as keyof typeof titles], orderId: id, createdAt: serverTimestamp(), read: false, pushState: "pending", event: next });
  });
}

/** Make a pre-worker-flow order available without changing any assigned order. */
export async function makeLegacyOrderAvailable(id: string) {
  await runTransaction(db, async transaction => {
    const ref = doc(db, "orderGroups", id); const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = snap.data();
    if (data.assignmentStatus === "available") return;
    if (data.assignmentStatus != null || data.assignedWorkerId != null || ["cancelled", "delivered"].includes(data.status)) throw new Error("Bestillingen kan ikke legges ut.");
    transaction.update(ref, { assignmentStatus: "available", assignedWorkerId: null, madeAvailableAt: serverTimestamp() });
  });
}

export async function releaseAssignedOrder(id: string) {
  await runTransaction(db, async transaction => {
    const ref = doc(db, "orderGroups", id); const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error("Bestillingen finnes ikke.");
    const data = snap.data();
    if (data.assignmentStatus !== "assigned" || !["placed", "confirmed", "preparing", "ready"].includes(data.status)) throw new Error("Kun oppdrag som ikke er hentet kan legges ut på nytt.");
    transaction.update(ref, { assignmentStatus: "available", assignedWorkerId: null, releasedAt: serverTimestamp() });
  });
}
