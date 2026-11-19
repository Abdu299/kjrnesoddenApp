import { doc, getDoc, getDocFromServer, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { defaultAppUpdatePolicy, parseAppUpdatePolicy, type AppUpdatePolicy } from "./appUpdatePolicy";

const reference = () => doc(db, "settings", "appUpdates");

export async function getAppUpdatePolicyFromServer(): Promise<AppUpdatePolicy> {
  const snapshot = await getDocFromServer(reference());
  return snapshot.exists() ? parseAppUpdatePolicy(snapshot.data()) : defaultAppUpdatePolicy;
}

export function subscribeToAppUpdatePolicy(onChange: (policy: AppUpdatePolicy) => void, onError: (error: Error) => void) {
  return onSnapshot(reference(), { includeMetadataChanges: true }, (snapshot) => {
    // A stale cached requirement must not override a rollback saved on the server.
    if (snapshot.metadata.fromCache) return;
    try { onChange(snapshot.exists() ? parseAppUpdatePolicy(snapshot.data()) : defaultAppUpdatePolicy); }
    catch (error) { onError(error as Error); }
  }, onError);
}

export async function saveAppUpdatePolicy(policy: AppUpdatePolicy, expectedRevision: number) {
  const user = auth.currentUser;
  if (!user) throw new Error("Logg inn som admin først.");
  const profile = await getDoc(doc(db, "users", user.uid));
  if (!profile.exists() || profile.data().role !== "admin") throw new Error("Du har ikke admintilgang.");
  const validated = parseAppUpdatePolicy({ ...policy, revision: expectedRevision + 1 });
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(reference());
    const revision = current.exists() ? parseAppUpdatePolicy(current.data()).revision : 0;
    if (revision !== expectedRevision) throw new Error("Oppsettet er endret av en annen admin. Avbryt og åpne innstillingene på nytt.");
    transaction.set(reference(), { ...validated, updatedAt: serverTimestamp(), updatedBy: user.uid });
  });
}
