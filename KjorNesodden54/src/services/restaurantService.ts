import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "./firebase";


// ==================================================
// TYPE
// ==================================================

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  imageUrl: string;
};


// ==================================================
// GET ACTIVE RESTAURANTS
// ==================================================

export async function getActiveRestaurants():
Promise<Restaurant[]> {
  const restaurantsQuery =
    query(
      collection(
        db,
        "restaurants"
      ),
      where(
        "active",
        "==",
        true
      )
    );

  const snapshot =
    await getDocs(
      restaurantsQuery
    );

  const restaurants =
    snapshot.docs.map(
      (restaurantDocument) => {
        const data =
          restaurantDocument.data();

        return {
          id:
            restaurantDocument.id,

          name:
            data.name ?? "",

          description:
            data.description ?? "",

          active:
            data.active ?? true,

          imageUrl:
            data.imageUrl ?? "",
        };
      }
    );

  // Sorter alfabetisk
  restaurants.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name
      )
  );

  return restaurants;
}


// ==================================================
// GET ONE RESTAURANT
// ==================================================

export async function getRestaurantById(
  restaurantId: string
): Promise<Restaurant | null> {
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
    return null;
  }

  const data =
    restaurantDocument.data();

  return {
    id:
      restaurantDocument.id,

    name:
      data.name ?? "",

    description:
      data.description ?? "",

    active:
      data.active ?? true,

    imageUrl:
      data.imageUrl ?? "",
  };
}