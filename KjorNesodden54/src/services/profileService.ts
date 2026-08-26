import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./firebase";

import {
  normalizeName,
  normalizePhone,
} from "./authService";


// ==================================================
// PROFILE TYPE
// ==================================================

export type ProfileData = {
  role:
    | "customer"
    | "restaurant"
    | "admin";

  name: string;

  email: string;

  phone: string;

  address: string;

  restaurantName: string;

  loginName: string;

  description: string;

  active: boolean | null;
};


// ==================================================
// GET PROFILE
// ==================================================

export async function getCurrentProfile():
Promise<ProfileData> {
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
    !userDocument.exists()
  ) {
    throw new Error(
      "Fant ikke kontoinformasjonen."
    );
  }


  const userData =
    userDocument.data();


  // ==================================================
  // CUSTOMER
  // ==================================================

  if (
    userData.role ===
    "customer"
  ) {
    return {
      role:
        "customer",

      name:
        userData.name ??
        "",

      email:
        currentUser.email ??
        userData.email ??
        "",

      phone:
        userData.phone ??
        "",

      address:
        userData.address ??
        "",

      restaurantName:
        "",

      loginName:
        "",

      description:
        "",

      active:
        null,
    };
  }


  // ==================================================
  // ADMIN
  // ==================================================

  if (
    userData.role ===
    "admin"
  ) {
    return {
      role:
        "admin",

      name:
        userData.name ??
        "",

      email:
        currentUser.email ??
        userData.email ??
        "",

      phone:
        userData.phone ??
        "",

      address:
        "",

      restaurantName:
        "",

      loginName:
        "",

      description:
        "",

      active:
        null,
    };
  }


  // ==================================================
  // RESTAURANT
  // ==================================================

  if (
    userData.role ===
    "restaurant"
  ) {
    const restaurantId =
      userData.restaurantId;


    if (!restaurantId) {
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
      throw new Error(
        "Restauranten finnes ikke."
      );
    }


    const restaurantData =
      restaurantDocument.data();


    return {
      role:
        "restaurant",

      name:
        "",

      email:
        "",

      phone:
        restaurantData.phone ??
        "",

      address:
        "",

      restaurantName:
        restaurantData.name ??
        userData.restaurantName ??
        "",

      loginName:
        restaurantData.loginName ??
        userData.restaurantName ??
        "",

      description:
        restaurantData.description ??
        "",

      active:
        restaurantData.active !== false,
    };
  }


  throw new Error(
    "Ugyldig brukerrolle."
  );
}


// ==================================================
// REQUIRE CUSTOMER
// ==================================================

async function getCustomerReference() {
  const currentUser =
    auth.currentUser;


  if (!currentUser) {
    throw new Error(
      "Du må være logget inn."
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
    !userDocument.exists()
  ) {
    throw new Error(
      "Brukerkontoen finnes ikke."
    );
  }


  if (
    userDocument.data().role !==
    "customer"
  ) {
    throw new Error(
      "Denne handlingen er ikke tilgjengelig for kontoen."
    );
  }


  return userReference;
}


// ==================================================
// UPDATE NAME
// ==================================================

export async function updateCustomerName(
  name: string
) {
  const userReference =
    await getCustomerReference();


  const cleanName =
    normalizeName(
      name
    );


  await updateDoc(
    userReference,
    {
      name:
        cleanName,

      updatedAt:
        serverTimestamp(),
    }
  );


  return cleanName;
}


// ==================================================
// UPDATE PHONE
// ==================================================

export async function updateCustomerPhone(
  phone: string
) {
  const userReference =
    await getCustomerReference();


  const normalizedPhone =
    normalizePhone(
      phone
    );


  await updateDoc(
    userReference,
    {
      phone:
        normalizedPhone,

      updatedAt:
        serverTimestamp(),
    }
  );


  return normalizedPhone;
}


// ==================================================
// UPDATE ADDRESS
// ==================================================

export async function updateCustomerAddress(
  address: string
) {
  const userReference =
    await getCustomerReference();


  const cleanAddress =
    address
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  if (
    cleanAddress.length < 5
  ) {
    throw new Error(
      "Skriv inn en gyldig adresse."
    );
  }


  await updateDoc(
    userReference,
    {
      address:
        cleanAddress,

      updatedAt:
        serverTimestamp(),
    }
  );


  return cleanAddress;
}