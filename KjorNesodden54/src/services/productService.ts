import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import {
  auth,
  db,
} from "./firebase";


// ==================================================
// TYPE
// ==================================================

export type Product = {
  id: string;

  restaurantId: string;

  name: string;

  description: string;

  price: number;

  imageData: string;

  available: boolean;
};


// ==================================================
// CONVERT FIRESTORE DOC TO PRODUCT
// ==================================================

function documentToProduct(
  productDocument: any
): Product {
  const data =
    productDocument.data();

  return {
    id:
      productDocument.id,

    restaurantId:
      data.restaurantId ??
      "",

    name:
      data.name ??
      "",

    description:
      data.description ??
      "",

    price:
      Number(
        data.price ??
        0
      ),

    imageData:
      data.imageData ??
      data.imageUrl ??
      "",

    available:
      data.available !==
      false,
  };
}


// ==================================================
// SORT PRODUCTS
// ==================================================

function sortProducts(
  products: Product[]
): Product[] {
  return products.sort(
    (
      a,
      b
    ) =>
      a.name.localeCompare(
        b.name
      )
  );
}


// ==================================================
// PRICE
// ==================================================

function normalizePrice(
  price: string
): number {
  const normalized =
    price
      .trim()
      .replace(
        ",",
        "."
      );


  const number =
    Number(
      normalized
    );


  if (
    Number.isNaN(
      number
    ) ||
    number <= 0
  ) {
    throw new Error(
      "Skriv inn en gyldig pris."
    );
  }


  return number;
}


// ==================================================
// GET CURRENT RESTAURANT ID
// ==================================================

async function getCurrentRestaurantId():
Promise<string> {
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
      "Brukeren finnes ikke."
    );
  }


  const data =
    userDocument.data();


  if (
    data.role !==
    "restaurant"
  ) {
    throw new Error(
      "Du har ikke restauranttilgang."
    );
  }


  if (
    !data.restaurantId
  ) {
    throw new Error(
      "Restaurantkontoen mangler restaurant."
    );
  }


  return data.restaurantId;
}


// ==================================================
// CREATE PRODUCT
// ==================================================

export async function createProduct(
  name: string,
  description: string,
  price: string,
  imageData: string
) {
  const restaurantId =
    await getCurrentRestaurantId();


  const cleanName =
    name.trim();


  const cleanDescription =
    description.trim();


  const cleanPrice =
    normalizePrice(
      price
    );


  if (!cleanName) {
    throw new Error(
      "Skriv inn produktnavn."
    );
  }


  if (
    !cleanDescription
  ) {
    throw new Error(
      "Skriv inn beskrivelse."
    );
  }


  if (
    imageData &&
    !imageData.startsWith(
      "data:image/"
    )
  ) {
    throw new Error(
      "Produktbildet er ugyldig."
    );
  }


  const productDocument =
    await addDoc(
      collection(
        db,
        "products"
      ),
      {
        restaurantId,

        name:
          cleanName,

        description:
          cleanDescription,

        price:
          cleanPrice,

        imageData:
          imageData ||
          "",

        available:
          true,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );


  return productDocument.id;
}


// ==================================================
// GET MY PRODUCTS
// ==================================================

export async function getMyProducts():
Promise<Product[]> {
  const restaurantId =
    await getCurrentRestaurantId();


  return getProductsForRestaurant(
    restaurantId
  );
}


// ==================================================
// GET PRODUCTS ONCE
// ==================================================

export async function getProductsForRestaurant(
  restaurantId: string
): Promise<Product[]> {
  const productsQuery =
    query(
      collection(
        db,
        "products"
      ),

      where(
        "restaurantId",
        "==",
        restaurantId
      )
    );


  const snapshot =
    await getDocs(
      productsQuery
    );


  const products =
    snapshot.docs.map(
      (
        productDocument
      ) =>
        documentToProduct(
          productDocument
        )
    );


  return sortProducts(
    products
  );
}


// ==================================================
// REALTIME PRODUCTS
// ==================================================

export function subscribeToProductsForRestaurant(
  restaurantId: string,
  onProductsChanged: (
    products: Product[]
  ) => void,
  onError?: (
    error: Error
  ) => void
) {
  const productsQuery =
    query(
      collection(
        db,
        "products"
      ),

      where(
        "restaurantId",
        "==",
        restaurantId
      )
    );


  const unsubscribe =
    onSnapshot(
      productsQuery,

      (
        snapshot
      ) => {
        const products =
          snapshot.docs.map(
            (
              productDocument
            ) =>
              documentToProduct(
                productDocument
              )
          );


        onProductsChanged(
          sortProducts(
            products
          )
        );
      },

      (
        error
      ) => {
        console.log(
          "Realtime products error:",
          error
        );


        if (
          onError
        ) {
          onError(
            error
          );
        }
      }
    );


  return unsubscribe;
}


// ==================================================
// AVAILABILITY
// ==================================================

export async function setProductAvailability(
  productId: string,
  available: boolean
) {
  const restaurantId =
    await getCurrentRestaurantId();


  const productReference =
    doc(
      db,
      "products",
      productId
    );


  const productDocument =
    await getDoc(
      productReference
    );


  if (
    !productDocument.exists()
  ) {
    throw new Error(
      "Produktet finnes ikke."
    );
  }


  const productData =
    productDocument.data();


  if (
    productData.restaurantId !==
    restaurantId
  ) {
    throw new Error(
      "Du kan ikke endre dette produktet."
    );
  }


  await updateDoc(
    productReference,
    {
      available,

      updatedAt:
        serverTimestamp(),
    }
  );
}