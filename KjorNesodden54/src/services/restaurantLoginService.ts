import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword, initializeAuth, inMemoryPersistence,
  signInWithEmailAndPassword, signOut,
} from "firebase/auth";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db, firebaseConfig } from "./firebase";

function loginEmail(name: string) {
  const normalized = name.trim().toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o")
    .replace(/å/g, "a").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  if (!normalized) throw new Error("Restauranten mangler et gyldig innloggingsnavn.");
  return `${normalized}@restaurant.kjornesodden.app`;
}

/** Attach credentials to an existing catalog entry without changing its menu or the admin session. */
export async function createRestaurantLogin(restaurantId: string, code: string) {
  const admin = auth.currentUser;
  if (!admin) throw new Error("Logg inn som admin først.");
  const adminRef = doc(db, "users", admin.uid);
  const adminSnapshot = await getDoc(adminRef);
  if (!adminSnapshot.exists() || adminSnapshot.data().role !== "admin") {
    throw new Error("Du har ikke admintilgang.");
  }
  const cleanCode = code.trim();
  if (cleanCode.length < 6) throw new Error("Restaurantkoden må være minst 6 tegn.");

  const restaurantRef = doc(db, "restaurants", restaurantId);
  const snapshot = await getDoc(restaurantRef);
  if (!snapshot.exists()) throw new Error("Restauranten finnes ikke lenger.");
  if (snapshot.data().authUid) throw new Error("Restauranten har allerede en innlogging.");
  const loginName = String(snapshot.data().loginName || snapshot.data().name || "").trim();
  const email = loginEmail(loginName);
  const secondaryApp = initializeApp(firebaseConfig, `restaurant-login-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });

  try {
    let credential;
    try {
      credential = await createUserWithEmailAndPassword(secondaryAuth, email, cleanCode);
    } catch (error) {
      if ((error as { code?: string }).code !== "auth/email-already-in-use") throw error;
      // Auth and Firestore cannot share a transaction. Resume an interrupted setup only
      // with the same password, and never reassign an existing role/account below.
      try {
        credential = await signInWithEmailAndPassword(secondaryAuth, email, cleanCode);
      } catch {
        throw new Error("Innloggingsnavnet er i bruk. Ved avbrutt oppretting må du bruke samme kode som sist.");
      }
    }

    const userRef = doc(db, "users", credential.user.uid);
    await runTransaction(db, async (transaction) => {
      const [currentAdmin, restaurant, existingUser] = await Promise.all([
        transaction.get(adminRef), transaction.get(restaurantRef), transaction.get(userRef),
      ]);
      if (auth.currentUser?.uid !== admin.uid || !currentAdmin.exists() || currentAdmin.data().role !== "admin") {
        throw new Error("Logg inn som admin først.");
      }
      if (!restaurant.exists()) throw new Error("Restauranten finnes ikke lenger.");
      const data = restaurant.data();
      if (existingUser.exists()) {
        if (existingUser.data().role === "restaurant" && existingUser.data().restaurantId === restaurantId &&
            data.authUid === credential.user.uid) return;
        throw new Error("Denne innloggingen er allerede knyttet til en konto. Ingen konto er endret.");
      }
      if (data.authUid) throw new Error("Restauranten har allerede en innlogging.");
      if (String(data.loginName || data.name || "").trim() !== loginName) {
        throw new Error("Restaurantnavnet ble endret. Last listen på nytt og prøv igjen.");
      }
      transaction.set(userRef, {
        role: "restaurant", restaurantId, restaurantName: loginName, createdAt: serverTimestamp(),
      });
      transaction.update(restaurantRef, {
        authUid: credential.user.uid, loginName, updatedAt: serverTimestamp(),
      });
    });
    return { loginName };
  } catch (error) {
    if ((error as { code?: string }).code) {
      throw new Error("Kunne ikke fullføre innloggingen. Kontroller tilkoblingen og prøv igjen med samme kode.");
    }
    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}
