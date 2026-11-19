import { collection, doc, getDoc, getDocs, runTransaction, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { FAGERSTRAND_GRILL, FAGERSTRAND_GRILL_MENU } from "../data/fagerstrandGrill";
import { isFagerstrandGrill } from "./restaurantCatalog";

type ImportResult = { created: boolean; restaurantId: string };
const IMPORT_VERSION = 1;

/** Run once using the signed-in admin's existing session, without creating login credentials. */
export async function ensureFagerstrandGrillCatalog(): Promise<ImportResult> {
  const user = auth.currentUser;
  if (!user) throw new Error("Logg inn som admin for å legge til Fagerstrand Grill.");
  const userReference = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userReference);
  if (!userSnapshot.exists() || userSnapshot.data().role !== "admin") throw new Error("Du har ikke admintilgang.");
  const previous = userSnapshot.data().catalogImports?.fagerstrandGrill;
  if (previous?.version === IMPORT_VERSION) return { created: false, restaurantId: previous.restaurantId };

  const restaurants = await getDocs(collection(db, "restaurants"));
  const existing = restaurants.docs.find((restaurant) => restaurant.id === FAGERSTRAND_GRILL.id ||
    isFagerstrandGrill(String(restaurant.data().name ?? "")));
  const restaurantId = existing?.id ?? FAGERSTRAND_GRILL.id;
  const restaurantReference = doc(db, "restaurants", restaurantId);
  const products = FAGERSTRAND_GRILL_MENU.categories.flatMap((category, categoryIndex) =>
    category.items.map((item, itemIndex) => ({
      reference: doc(db, "products", `menu-fagerstrand-grill-${categoryIndex}-${itemIndex}`),
      item, category: category.name,
    })));

  return runTransaction(db, async (transaction) => {
    const [currentUser, currentRestaurant] = await Promise.all([
      transaction.get(userReference), transaction.get(restaurantReference),
    ]);
    if (!currentUser.exists() || currentUser.data().role !== "admin") throw new Error("Du har ikke admintilgang.");
    const imports = currentUser.data().catalogImports ?? {};
    if (imports.fagerstrandGrill?.version === IMPORT_VERSION) {
      return { created: false, restaurantId: imports.fagerstrandGrill.restaurantId };
    }

    if (!currentRestaurant.exists()) {
      // Read before writing so retries remain atomic and any manually edited products survive.
      const currentProducts = await Promise.all(products.map((product) => transaction.get(product.reference)));
      if (currentProducts.some((product) => product.exists() && product.data().restaurantId !== restaurantId)) {
        throw new Error("Menyen er allerede knyttet til en annen restaurant. Kontroller restaurantene i admin.");
      }
      transaction.set(restaurantReference, {
        name: FAGERSTRAND_GRILL.name, description: FAGERSTRAND_GRILL.description,
        imageUrl: FAGERSTRAND_GRILL.imageUrl, deliveryAreaId: FAGERSTRAND_GRILL.deliveryAreaId,
        openingHours: FAGERSTRAND_GRILL.openingHours, closedUntil: FAGERSTRAND_GRILL.closedUntil,
        active: true, loginName: FAGERSTRAND_GRILL.name,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      products.forEach((product, index) => {
        if (currentProducts[index].exists()) return;
        transaction.set(product.reference, {
          restaurantId, name: product.item.name, description: product.item.description,
          price: product.item.price, category: product.category, sortOrder: index,
          imageData: "", available: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      });
    }

    // Remember completion so later admin edits, deactivation or deletion are respected.
    transaction.update(userReference, { catalogImports: { ...imports, fagerstrandGrill: {
      version: IMPORT_VERSION, restaurantId, completedAt: serverTimestamp(),
    } } });
    return { created: !currentRestaurant.exists(), restaurantId };
  });
}
