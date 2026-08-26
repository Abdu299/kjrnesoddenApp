import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./firebase";


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


  const credential =
    await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password
    );


  const user =
    credential.user;


  await setDoc(
    doc(
      db,
      "users",
      user.uid
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


  return user;
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
        error.message ===
          "Skriv inn en gyldig e-postadresse." ||
        error.message ===
          "Ingen kontoinformasjon ble funnet." ||
        error.message ===
          "Denne kontoen kan ikke logge inn med e-post."
      ) {
        throw error;
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
      error.message ===
      "Restaurantkontoen er deaktivert."
    ) {
      throw error;
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
// LOGOUT
// ==================================================

export async function logout() {
  await signOut(
    auth
  );
}