import { restaurantDeliveryArea, type DeliveryAreaId } from "./deliveryPricing";
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  db,
} from "./firebase";

import {
  restaurantClosedUntil,
  restaurantOpeningHours,
  WeeklyOpeningHours,
} from "./openingHoursService";


// ==================================================
// TYPE
// ==================================================

export type Restaurant = {
  deliveryAreaId: DeliveryAreaId | null;
  id: string;
  name: string;
  description: string;
  active: boolean;
  imageUrl: string;
  openingHours: WeeklyOpeningHours;
  closedUntil: string;
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

          deliveryAreaId: restaurantDeliveryArea(data.name ?? "", data.deliveryAreaId),

          name:
            data.name ?? "",

          description:
            data.description ?? "",

          active:
            data.active ?? true,

          imageUrl:
            data.imageUrl ?? "",

          openingHours:
            restaurantOpeningHours(data.name ?? "", data.openingHours),

          closedUntil:
            restaurantClosedUntil(data.name ?? "", data.closedUntil),
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
  restaurantId: string,
  fresh = false
): Promise<Restaurant | null> {
  const restaurantDocument =
    await (fresh ? getDocFromServer : getDoc)(
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

    deliveryAreaId: restaurantDeliveryArea(data.name ?? "", data.deliveryAreaId),

    name:
      data.name ?? "",

    description:
      data.description ?? "",

    active:
      data.active ?? true,

    imageUrl:
      data.imageUrl ?? "",

    openingHours:
      restaurantOpeningHours(data.name ?? "", data.openingHours),

    closedUntil:
      restaurantClosedUntil(data.name ?? "", data.closedUntil),
  };
}


export function subscribeToActiveRestaurants(onChange: (restaurants: Restaurant[]) => void, onError: (error: Error) => void) {
  return onSnapshot(query(collection(db, "restaurants"), where("active", "==", true)), (snapshot) => {
    onChange(snapshot.docs.map((document) => {
      const data = document.data();
      return { id: document.id, name: data.name ?? "", description: data.description ?? "",
        active: data.active === true, imageUrl: data.imageUrl ?? "",
        deliveryAreaId: restaurantDeliveryArea(data.name ?? "", data.deliveryAreaId),
        openingHours: restaurantOpeningHours(data.name ?? "", data.openingHours),
        closedUntil: restaurantClosedUntil(data.name ?? "", data.closedUntil) };
    }));
  }, onError);
}
