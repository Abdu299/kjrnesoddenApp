import {
  deleteApp,
  initializeApp,
} from "firebase/app";

import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
  firebaseConfig,
} from "./firebase";

import {
  defaultClosedUntil,
  defaultOpeningHours,
  restaurantClosedUntil,
  restaurantOpeningHours,
  WeeklyOpeningHours,
} from "./openingHoursService";


// ==================================================
// TYPE
// ==================================================

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  authUid?: string;
  imageUrl: string;
  loginName: string;
  openingHours: WeeklyOpeningHours;
  closedUntil: string;
};


// ==================================================
// NORMALIZE RESTAURANT NAME
// ==================================================

function normalizeRestaurantName(
  name: string
): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}


// ==================================================
// RESTAURANT NAME -> HIDDEN FIREBASE EMAIL
// ==================================================

function restaurantNameToEmail(
  name: string
): string {
  const normalizedName =
    normalizeRestaurantName(name);

  if (!normalizedName) {
    throw new Error(
      "Skriv inn restaurantnavn."
    );
  }

  return `${normalizedName}@restaurant.kjornesodden.app`;
}


// ==================================================
// IMAGE URL VALIDATION
// ==================================================

function validateImageUrl(
  imageUrl: string
) {
  const cleanUrl =
    imageUrl.trim();

  // Image is optional
  if (!cleanUrl) {
    return "";
  }

  if (
    !cleanUrl.startsWith("http://") &&
    !cleanUrl.startsWith("https://")
  ) {
    throw new Error(
      "Bildeadressen må starte med http:// eller https://."
    );
  }

  return cleanUrl;
}


// ==================================================
// REQUIRE ADMIN
// ==================================================

async function requireAdmin() {
  const currentUser =
    auth.currentUser;

  if (!currentUser) {
    throw new Error(
      "Du må være logget inn."
    );
  }

  const userDocument =
    await getDoc(
      doc(
        db,
        "users",
        currentUser.uid
      )
    );

  if (
    !userDocument.exists() ||
    userDocument.data().role !== "admin"
  ) {
    throw new Error(
      "Du har ikke admintilgang."
    );
  }

  return currentUser;
}


// ==================================================
// CREATE RESTAURANT
// ==================================================

export async function createRestaurant(
  name: string,
  description: string,
  code: string,
  imageUrl: string
) {
  await requireAdmin();

  const cleanName =
    name.trim();

  const cleanDescription =
    description.trim();

  const cleanCode =
    code.trim();

  const cleanImageUrl =
    validateImageUrl(imageUrl);


  // ==================================================
  // VALIDATION
  // ==================================================

  if (!cleanName) {
    throw new Error(
      "Skriv inn restaurantnavn."
    );
  }

  if (!cleanDescription) {
    throw new Error(
      "Skriv inn beskrivelse."
    );
  }

  if (cleanCode.length < 6) {
    throw new Error(
      "Restaurantkoden må være minst 6 tegn."
    );
  }


  const restaurantEmail =
    restaurantNameToEmail(
      cleanName
    );


  // ==================================================
  // SECONDARY FIREBASE APP
  // ==================================================

  const secondaryApp =
    initializeApp(
      firebaseConfig,
      `restaurant-${Date.now()}`
    );

  const secondaryAuth =
    getAuth(secondaryApp);


  try {
    // ==================================================
    // CREATE AUTH ACCOUNT
    // ==================================================

    const credential =
      await createUserWithEmailAndPassword(
        secondaryAuth,
        restaurantEmail,
        cleanCode
      );

    const restaurantUser =
      credential.user;


    // ==================================================
    // CREATE RESTAURANT DOCUMENT
    // ==================================================

    const restaurantDocument =
      await addDoc(
        collection(
          db,
          "restaurants"
        ),
        {
          name:
            cleanName,

          // This never changes.
          // Restaurant uses this name for login.
          loginName:
            cleanName,

          description:
            cleanDescription,

          active:
            true,

          authUid:
            restaurantUser.uid,

          imageUrl:
            cleanImageUrl,

          openingHours:
            defaultOpeningHours(cleanName),

          closedUntil:
            defaultClosedUntil(cleanName),

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        }
      );


    // ==================================================
    // CREATE USER ROLE
    // ==================================================

    await setDoc(
      doc(
        db,
        "users",
        restaurantUser.uid
      ),
      {
        role:
          "restaurant",

        restaurantId:
          restaurantDocument.id,

        // Keep original login name
        restaurantName:
          cleanName,

        createdAt:
          serverTimestamp(),
      }
    );


    await signOut(
      secondaryAuth
    );


    return {
      restaurantId:
        restaurantDocument.id,

      userId:
        restaurantUser.uid,
    };

  } catch (error: any) {
    if (
      error.code ===
      "auth/email-already-in-use"
    ) {
      throw new Error(
        "En restaurant med dette innloggingsnavnet finnes allerede."
      );
    }

    throw error;

  } finally {
    await deleteApp(
      secondaryApp
    );
  }
}


// ==================================================
// GET RESTAURANTS
// ==================================================

export async function getRestaurants():
Promise<Restaurant[]> {
  const restaurantsQuery =
    query(
      collection(
        db,
        "restaurants"
      ),
      orderBy(
        "createdAt",
        "desc"
      )
    );

  const snapshot =
    await getDocs(
      restaurantsQuery
    );

  return snapshot.docs.map(
    (restaurantDocument) => {
      const data =
        restaurantDocument.data();

      return {
        id:
          restaurantDocument.id,

        name:
          data.name ?? "",

        // Old restaurants don't have loginName yet.
        // In that case, their current name is used.
        loginName:
          data.loginName ??
          data.name ??
          "",

        description:
          data.description ?? "",

        active:
          data.active ?? true,

        authUid:
          data.authUid,

        imageUrl:
          data.imageUrl ?? "",

        openingHours:
          restaurantOpeningHours(data.name ?? "", data.openingHours),

        closedUntil:
          restaurantClosedUntil(data.name ?? "", data.closedUntil),
      };
    }
  );
}


// ==================================================
// UPDATE RESTAURANT
// ==================================================

export async function updateRestaurant(
  restaurantId: string,
  name: string,
  description: string,
  imageUrl: string,
  openingHours: WeeklyOpeningHours
) {
  await requireAdmin();

  const cleanName =
    name.trim();

  const cleanDescription =
    description.trim();

  const cleanImageUrl =
    validateImageUrl(imageUrl);


  if (!cleanName) {
    throw new Error(
      "Skriv inn restaurantnavn."
    );
  }

  if (!cleanDescription) {
    throw new Error(
      "Skriv inn beskrivelse."
    );
  }

  if (
    openingHours.length !== 7 ||
    openingHours.some(
      (period) =>
        period !== null &&
        (!/^([01]\d|2[0-3]):[0-5]\d$/.test(period.open) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(period.close) ||
          period.open >= period.close)
    )
  ) {
    throw new Error("Kontroller åpningstidene. Bruk formatet TT:MM, og stenging må være etter åpning.");
  }


  await updateDoc(
    doc(
      db,
      "restaurants",
      restaurantId
    ),
    {
      name:
        cleanName,

      description:
        cleanDescription,

      imageUrl:
        cleanImageUrl,

      openingHours,

      updatedAt:
        serverTimestamp(),
    }
  );
}


// ==================================================
// DISABLE RESTAURANT
// ==================================================

export async function disableRestaurant(
  restaurantId: string
) {
  await requireAdmin();

  await updateDoc(
    doc(
      db,
      "restaurants",
      restaurantId
    ),
    {
      active:
        false,

      updatedAt:
        serverTimestamp(),
    }
  );
}


// ==================================================
// ENABLE RESTAURANT
// ==================================================

export async function enableRestaurant(
  restaurantId: string
) {
  await requireAdmin();

  await updateDoc(
    doc(
      db,
      "restaurants",
      restaurantId
    ),
    {
      active:
        true,

      updatedAt:
        serverTimestamp(),
    }
  );
}
