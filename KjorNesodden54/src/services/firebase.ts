import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getAuth,
  initializeAuth,
  type Auth,
} from "firebase/auth";

import * as FirebaseAuth from
  "firebase/auth";

import {
  getFirestore,
} from "firebase/firestore";

import {
  getFunctions,
} from "firebase/functions";

import AsyncStorage from
  "@react-native-async-storage/async-storage";

import {
  Platform,
} from "react-native";


// ==================================================
// FIREBASE CONFIG
// ==================================================

export const firebaseConfig = {
  apiKey:
    "AIzaSyAroO_lPkWSreBkTpdnQP1PFCN8n6kGlME",

  authDomain:
    "kjornesodden.firebaseapp.com",

  projectId:
    "kjornesodden",

  storageBucket:
    "kjornesodden.firebasestorage.app",

  messagingSenderId:
    "944896162995",

  appId:
    "1:944896162995:web:ef668e57706bb6a5f784c6",
};


// ==================================================
// FIREBASE APP
// ==================================================

const app =
  getApps().length === 0
    ? initializeApp(
        firebaseConfig
      )
    : getApp();


// ==================================================
// AUTH
// ==================================================

let auth: Auth;


// ==================================================
// WEB
// ==================================================

if (
  Platform.OS === "web"
) {
  auth =
    getAuth(
      app
    );
}


// ==================================================
// IOS / ANDROID
// ==================================================

else {
  try {
    /*
      Firebase 12 har en TypeScript-problematikk hvor
      getReactNativePersistence finnes i React Native
      runtime, men ikke alltid vises i firebase/auth
      sine TypeScript exports.

      Derfor henter vi funksjonen fra modulen her.
    */

    const getReactNativePersistence =
      (
        FirebaseAuth as any
      ).getReactNativePersistence;


    if (
      typeof getReactNativePersistence !==
      "function"
    ) {
      throw new Error(
        "Firebase React Native persistence er ikke tilgjengelig."
      );
    }


    auth =
      initializeAuth(
        app,
        {
          persistence:
            getReactNativePersistence(
              AsyncStorage
            ),
        }
      );

  } catch (
    error: any
  ) {
    /*
      Expo Fast Refresh kan forsøke å
      initialisere Auth flere ganger.

      Hvis Auth allerede finnes,
      bruker vi den eksisterende.
    */

    if (
      error?.code ===
      "auth/already-initialized"
    ) {
      auth =
        getAuth(
          app
        );

    } else {
      console.log(
        "Firebase Auth init error:",
        error
      );

      throw error;
    }
  }
}


// ==================================================
// FIRESTORE
// ==================================================

const db =
  getFirestore(
    app
  );


// ==================================================
// CLOUD FUNCTIONS
// ==================================================

// Keep the function close to users in Norway and use the
// same region in functions/src/index.ts.
const functions =
  getFunctions(
    app,
    "europe-west1"
  );


// ==================================================
// EXPORT
// ==================================================

export {
  app,
  auth,
  db,
  functions,
};
