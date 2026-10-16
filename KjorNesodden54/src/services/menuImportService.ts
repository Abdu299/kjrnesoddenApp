import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import {
  WEBSITE_RESTAURANT_MENUS,
  WebsiteRestaurantMenu,
} from "../data/websiteMenus";

import {
  auth,
  db,
} from "./firebase";


function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}


function findMenu(restaurantName: string): WebsiteRestaurantMenu | undefined {
  const normalizedRestaurant = normalizeName(restaurantName);

  return WEBSITE_RESTAURANT_MENUS.find((menu) =>
    menu.aliases.some((alias) => {
      const normalizedAlias = normalizeName(alias);
      return normalizedRestaurant === normalizedAlias ||
        normalizedRestaurant.includes(normalizedAlias);
    })
  );
}


async function requireAdmin() {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Du må være logget inn som admin.");
  }

  const userDocument = await getDoc(
    doc(db, "users", currentUser.uid)
  );

  if (!userDocument.exists() || userDocument.data().role !== "admin") {
    throw new Error("Du har ikke admintilgang.");
  }
}


export type MenuImportResult = {
  restaurantCount: number;
  productCount: number;
  unmatchedRestaurants: string[];
};


export async function importWebsiteMenusToFirestore(): Promise<MenuImportResult> {
  await requireAdmin();

  const [restaurantSnapshot, productSnapshot] = await Promise.all([
    getDocs(collection(db, "restaurants")),
    getDocs(collection(db, "products")),
  ]);

  const existingProductIds = new Set(
    productSnapshot.docs.map((productDocument) => productDocument.id)
  );
  const batch = writeBatch(db);
  const unmatchedRestaurants: string[] = [];
  let restaurantCount = 0;
  let productCount = 0;

  for (const restaurantDocument of restaurantSnapshot.docs) {
    const restaurantName = String(restaurantDocument.data().name ?? "");
    const menu = findMenu(restaurantName);

    if (!menu) {
      unmatchedRestaurants.push(restaurantName || restaurantDocument.id);
      continue;
    }

    restaurantCount += 1;
    let sortOrder = 0;

    menu.categories.forEach((category, categoryIndex) => {
      category.items.forEach((item, itemIndex) => {
        const productId = `menu-${menu.slug}-${categoryIndex}-${itemIndex}`;
        const productReference = doc(db, "products", productId);
        const alreadyExists = existingProductIds.has(productId);

        batch.set(
          productReference,
          {
            restaurantId: restaurantDocument.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageData: "",
            category: category.name,
            sortOrder,
            updatedAt: serverTimestamp(),
            ...(!alreadyExists
              ? {
                  available: true,
                  createdAt: serverTimestamp(),
                }
              : {}),
          },
          { merge: true }
        );

        sortOrder += 1;
        productCount += 1;
      });
    });
  }

  if (productCount === 0) {
    throw new Error(
      "Ingen restaurantnavn samsvarer med menyene. Kontroller restaurantnavnene i adminpanelet."
    );
  }

  await batch.commit();

  return {
    restaurantCount,
    productCount,
    unmatchedRestaurants,
  };
}
