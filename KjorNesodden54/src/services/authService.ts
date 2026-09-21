import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  auth,
  db,
} from "./firebase";


const CART_STORAGE_PREFIX =
  "kjornesodden-cart";


// ==================================================
// TYPES
// ==================================================

export type UserRole =
  | "customer"
  | "restaurant"
  | "admin";


// ==================================================
// NAME
// ==================================================

export function normalizeName(
  name: string
): string {
  const cleanName =
    name
      .trim()
      .replace(/\s+/g, " ");


  if (
    cleanName.length < 2
  ) {
    throw new Error(
      "Skriv inn navnet ditt."
    );
  }


  if (
    cleanName.length > 80
  ) {
    throw new Error(
      "Navnet er for langt."
    );
  }


  return cleanName;
}


// ==================================================
// PHONE
// ==================================================

export function normalizePhone(
  phone: string
): string {
  const value =
    phone.trim();


  if (
    !/^\+?[\d\s]+$/.test(
      value
    )
  ) {
    throw new Error(
      "Mobilnummer kan bare inneholde tall."
    );
  }


  const digits =
    value.replace(
      /\D/g,
      ""
    );


  if (
    digits.length === 8
  ) {
    return `+47${digits}`;
  }


  if (
    digits.length === 10 &&
    digits.startsWith(
      "47"
    )
  ) {
    return `+${digits}`;
  }


  throw new Error(
    "Skriv inn et gyldig norsk mobilnummer."
  );
}


// ==================================================
// EMAIL
// ==================================================

export function normalizeEmail(
  email: string
): string {
  const cleanEmail =
    email
      .trim()
      .toLowerCase();


  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


  if (
    !emailRegex.test(
      cleanEmail
    )
  ) {
    throw new Error(
      "Skriv inn en gyldig e-postadresse."
    );
  }


  return cleanEmail;
}


// ==================================================
// REGISTER CUSTOMER
// ==================================================

export async function registerCustomer(
  name: string,
  email: string,
  phone: string,
  password: string
) {
  const cleanName =
    normalizeName(
      name
    );


  const cleanEmail =
    normalizeEmail(
      email
    );


  const normalizedPhone =
    normalizePhone(
      phone
    );


  if (
    password.length < 6
  ) {
    throw new Error(
      "Passordet må være minst 6 tegn."
    );
  }


  let createdUser:
    User | null =
      null;


  try {
    const credential =
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );


    createdUser =
      credential.user;


    try {
      await setDoc(
        doc(
          db,
          "users",
          createdUser.uid
        ),
        {
          role:
            "customer",

          name:
            cleanName,

          email:
            cleanEmail,

          phone:
            normalizedPhone,

          address:
            "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );

    } catch (error: any) {
      console.log(
        "Customer profile creation error:",
        error
      );


      try {
        await deleteUser(
          createdUser
        );

      } catch (rollbackError) {
        console.log(
          "Could not roll back Firebase Auth user:",
          rollbackError
        );
      }


      if (
        error?.code ===
          "permission-denied" ||
        error?.code ===
          "firestore/permission-denied"
      ) {
        throw new Error(
          "Kontoen kunne ikke opprettes på grunn av manglende tilgang. Prøv igjen senere."
        );
      }


      if (
        error?.code ===
          "unavailable" ||
        error?.code ===
          "firestore/unavailable"
      ) {
        throw new Error(
          "Kunne ikke koble til tjenesten. Sjekk internettforbindelsen og prøv igjen."
        );
      }


      throw new Error(
        "Kunne ikke opprette brukerprofilen. Prøv igjen."
      );
    }


    return createdUser;

  } catch (error: any) {
    console.log(
      "Customer registration error:",
      error
    );


    if (
      error?.message ===
        "Kontoen kunne ikke opprettes på grunn av manglende tilgang. Prøv igjen senere." ||
      error?.message ===
        "Kunne ikke koble til tjenesten. Sjekk internettforbindelsen og prøv igjen." ||
      error?.message ===
        "Kunne ikke opprette brukerprofilen. Prøv igjen."
    ) {
      throw error;
    }


    if (
      error?.code ===
        "auth/email-already-in-use"
    ) {
      throw new Error(
        "Det finnes allerede en konto med denne e-postadressen."
      );
    }


    if (
      error?.code ===
        "auth/invalid-email"
    ) {
      throw new Error(
        "Skriv inn en gyldig e-postadresse."
      );
    }


    if (
      error?.code ===
        "auth/weak-password"
    ) {
      throw new Error(
        "Passordet er for svakt. Velg et sterkere passord."
      );
    }


    if (
      error?.code ===
        "auth/network-request-failed"
    ) {
      throw new Error(
        "Kunne ikke koble til. Sjekk internettforbindelsen og prøv igjen."
      );
    }


    if (
      error?.code ===
        "auth/too-many-requests"
    ) {
      throw new Error(
        "For mange forsøk. Vent litt og prøv igjen."
      );
    }


    if (
      error?.code ===
        "auth/operation-not-allowed"
    ) {
      throw new Error(
        "Registrering er midlertidig utilgjengelig. Prøv igjen senere."
      );
    }


    throw new Error(
      error?.message ||
        "Kunne ikke opprette konto. Prøv igjen."
    );
  }
}


// ==================================================
// RESTAURANT ACCOUNT NAME
// ==================================================

function normalizeAccountName(
  name: string
): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]/g,
      ""
    );
}


// ==================================================
// RESTAURANT HIDDEN EMAIL
// ==================================================

function restaurantNameToEmail(
  restaurantName: string
): string {
  const cleanedName =
    normalizeAccountName(
      restaurantName
    );


  if (!cleanedName) {
    throw new Error(
      "Skriv inn et gyldig restaurantnavn."
    );
  }


  return `${cleanedName}@restaurant.kjornesodden.app`;
}


// ==================================================
// GET USER DATA
// ==================================================

async function getUserData(
  user: User
) {
  const userDocument =
    await getDoc(
      doc(
        db,
        "users",
        user.uid
      )
    );


  if (
    !userDocument.exists()
  ) {
    return null;
  }


  return userDocument.data();
}


// ==================================================
// LOGIN WITH EMAIL
// Customer / Admin
// ==================================================

async function loginWithEmail(
  email: string,
  password: string
) {
  const cleanEmail =
    normalizeEmail(
      email
    );


  const credential =
    await signInWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );


  const userData =
    await getUserData(
      credential.user
    );


  if (!userData) {
    await signOut(
      auth
    );

    throw new Error(
      "Ingen kontoinformasjon ble funnet."
    );
  }


  if (
    userData.role !== "customer" &&
    userData.role !== "admin"
  ) {
    await signOut(
      auth
    );

    throw new Error(
      "Denne kontoen kan ikke logge inn med e-post."
    );
  }


  return {
    user:
      credential.user,

    role:
      userData.role as
        | "customer"
        | "admin",
  };
}


// ==================================================
// LOGIN RESTAURANT
// ==================================================

async function loginAsRestaurant(
  restaurantName: string,
  password: string
) {
  const firebaseEmail =
    restaurantNameToEmail(
      restaurantName
    );


  const credential =
    await signInWithEmailAndPassword(
      auth,
      firebaseEmail,
      password
    );


  const userData =
    await getUserData(
      credential.user
    );


  if (
    !userData ||
    userData.role !== "restaurant"
  ) {
    await signOut(
      auth
    );

    throw new Error(
      "Denne kontoen har ikke restauranttilgang."
    );
  }


  const restaurantId =
    userData.restaurantId;


  if (!restaurantId) {
    await signOut(
      auth
    );

    throw new Error(
      "Restaurantkontoen mangler restaurant."
    );
  }


  const restaurantDocument =
    await getDoc(
      doc(
        db,
        "restaurants",
        restaurantId
      )
    );


  if (
    !restaurantDocument.exists()
  ) {
    await signOut(
      auth
    );

    throw new Error(
      "Restauranten finnes ikke."
    );
  }


  if (
    restaurantDocument
      .data()
      .active === false
  ) {
    await signOut(
      auth
    );

    throw new Error(
      "Restaurantkontoen er deaktivert."
    );
  }


  return {
    user:
      credential.user,

    role:
      "restaurant" as const,
  };
}


// ==================================================
// UNIFIED LOGIN
// ==================================================

export async function login(
  identifier: string,
  password: string
) {
  const value =
    identifier.trim();


  if (!value) {
    throw new Error(
      "Skriv inn e-post eller restaurantnavn."
    );
  }


  if (!password) {
    throw new Error(
      "Skriv inn passord."
    );
  }


  if (
    value.includes("@")
  ) {
    try {
      return await loginWithEmail(
        value,
        password
      );

    } catch (error: any) {
      console.log(
        "Email login error:",
        error
      );


      if (
        error?.message ===
          "Skriv inn en gyldig e-postadresse." ||
        error?.message ===
          "Ingen kontoinformasjon ble funnet." ||
        error?.message ===
          "Denne kontoen kan ikke logge inn med e-post."
      ) {
        throw error;
      }


      if (
        error?.code ===
          "auth/network-request-failed"
      ) {
        throw new Error(
          "Kunne ikke koble til. Sjekk internettforbindelsen og prøv igjen."
        );
      }


      if (
        error?.code ===
          "auth/too-many-requests"
      ) {
        throw new Error(
          "For mange innloggingsforsøk. Vent litt og prøv igjen."
        );
      }


      if (
        error?.code ===
          "auth/user-disabled"
      ) {
        throw new Error(
          "Denne kontoen er deaktivert."
        );
      }


      throw new Error(
        "Feil e-post eller passord."
      );
    }
  }


  try {
    return await loginAsRestaurant(
      value,
      password
    );

  } catch (error: any) {
    console.log(
      "Restaurant login error:",
      error
    );


    if (
      error?.message ===
        "Restaurantkontoen er deaktivert."
    ) {
      throw error;
    }


    if (
      error?.code ===
        "auth/network-request-failed"
    ) {
      throw new Error(
        "Kunne ikke koble til. Sjekk internettforbindelsen og prøv igjen."
      );
    }


    if (
      error?.code ===
        "auth/too-many-requests"
    ) {
      throw new Error(
        "For mange innloggingsforsøk. Vent litt og prøv igjen."
      );
    }


    if (
      error?.code ===
        "auth/user-disabled"
    ) {
      throw new Error(
        "Denne kontoen er deaktivert."
      );
    }


    throw new Error(
      "Feil restaurantnavn eller passord."
    );
  }
}


// ==================================================
// PASSWORD RESET
// ==================================================

export async function sendPasswordResetLink(
  email: string
) {
  const cleanEmail =
    normalizeEmail(
      email
    );


  await sendPasswordResetEmail(
    auth,
    cleanEmail
  );
}



// ==================================================
// DELETE CUSTOMER ACCOUNT
// ==================================================

async function deleteCustomerRestaurantRequests(
  userId: string
) {
  const requestsQuery =
    query(
      collection(
        db,
        "restaurantRequests"
      ),

      where(
        "customerId",
        "==",
        userId
      )
    );


  const snapshot =
    await getDocs(
      requestsQuery
    );


  const documents =
    snapshot.docs;


  const BATCH_SIZE =
    400;


  for (
    let start = 0;
    start < documents.length;
    start += BATCH_SIZE
  ) {
    const batch =
      writeBatch(
        db
      );


    documents
      .slice(
        start,
        start +
          BATCH_SIZE
      )
      .forEach(
        (
          requestDocument
        ) => {
          batch.delete(
            requestDocument.ref
          );
        }
      );


    await batch.commit();
  }
}


export async function deleteCustomerAccount(
  password: string
) {
  const currentUser =
    auth.currentUser;


  if (
    !currentUser
  ) {
    throw new Error(
      "Du må være logget inn."
    );
  }


  if (
    !currentUser.email
  ) {
    throw new Error(
      "Kontoen mangler e-postadresse."
    );
  }


  if (
    !password
  ) {
    throw new Error(
      "Skriv inn passordet ditt."
    );
  }


  const userReference =
    doc(
      db,
      "users",
      currentUser.uid
    );


  const userDocument =
    await getDoc(
      userReference
    );


  if (
    !userDocument.exists() ||
    userDocument.data().role !==
      "customer"
  ) {
    throw new Error(
      "Kun kundekontoer kan slettes her."
    );
  }


  const credential =
    EmailAuthProvider
      .credential(
        currentUser.email,
        password
      );


  try {
    await reauthenticateWithCredential(
      currentUser,
      credential
    );

  } catch (
    error: any
  ) {
    console.log(
      "Account deletion reauthentication error:",
      error
    );


    if (
      error?.code ===
        "auth/invalid-credential" ||
      error?.code ===
        "auth/wrong-password"
    ) {
      throw new Error(
        "Passordet er feil."
      );
    }


    if (
      error?.code ===
      "auth/too-many-requests"
    ) {
      throw new Error(
        "For mange forsøk. Vent litt og prøv igjen."
      );
    }


    throw new Error(
      "Kunne ikke bekrefte passordet. Prøv igjen."
    );
  }


  const userId =
    currentUser.uid;


  await deleteCustomerRestaurantRequests(
    userId
  );


  await deleteDoc(
    userReference
  );


  try {
    await AsyncStorage
      .removeItem(
        `${CART_STORAGE_PREFIX}-${userId}`
      );

  } catch (
    error
  ) {
    console.log(
      "Could not remove local cart during account deletion:",
      error
    );
  }


  try {
    await deleteUser(
      currentUser
    );

  } catch (
    error: any
  ) {
    console.log(
      "Firebase Auth account deletion error:",
      error
    );


    if (
      error?.code ===
      "auth/requires-recent-login"
    ) {
      throw new Error(
        "Du må bekrefte passordet ditt på nytt før kontoen kan slettes."
      );
    }


    throw new Error(
      "Kunne ikke slette innloggingskontoen. Prøv igjen."
    );
  }


  return {
    success:
      true,
  };
}


// ==================================================
// LOGOUT
// ==================================================

export async function logout() {
  await signOut(
    auth
  );
}