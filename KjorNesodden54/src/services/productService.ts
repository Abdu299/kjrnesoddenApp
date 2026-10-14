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

  category?: string;

  sortOrder?: number;
};


type WebsiteRestaurantMenu = {
  slug: string;
  aliases: string[];
};


const WEBSITE_RESTAURANT_MENUS: WebsiteRestaurantMenu[] = [
  { slug: "signalen", aliases: ["signalen", "signalen sjøbad"] },
  { slug: "tonys-sushi", aliases: ["tonys sushi", "tonys sushi og thai", "tony sushi"] },
  { slug: "jafs", aliases: ["jafs", "jafs nesodden"] },
  { slug: "jonathan-sushi", aliases: ["jonathan sushi", "jonathan"] },
  { slug: "flaskebekk-bistro", aliases: ["flaskebekk bistro", "flaskebekk"] },
  { slug: "o-sole-mio", aliases: ["o sole mio", "o'sole mio", "o’ sole mio"] },
  { slug: "mama-greek-kitchen", aliases: ["mama greek kitchen", "mama greek kitchen fagerstrand"] },
];


function normalizeRestaurantName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}


function decodeHtml(value: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    hellip: "…",
    laquo: "«",
    lt: "<",
    nbsp: " ",
    ndash: "–",
    quot: '"',
    raquo: "»",
    rsquo: "’",
  };

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
      if (entity.startsWith("#x")) {
        return String.fromCodePoint(parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith("#")) {
        return String.fromCodePoint(parseInt(entity.slice(1), 10));
      }
      return entities[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}


function getWebsiteMenuDefinition(restaurantName: string): WebsiteRestaurantMenu | null {
  const normalizedName = normalizeRestaurantName(restaurantName);

  return WEBSITE_RESTAURANT_MENUS.find(({ aliases }) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeRestaurantName(alias);
      return normalizedName === normalizedAlias || normalizedName.includes(normalizedAlias);
    })
  ) ?? null;
}


export function hasWebsiteMenu(restaurantName: string): boolean {
  return getWebsiteMenuDefinition(restaurantName) !== null;
}


export async function getWebsiteMenuForRestaurant(
  restaurantId: string,
  restaurantName: string
): Promise<Product[]> {
  const menu = getWebsiteMenuDefinition(restaurantName);

  if (!menu) {
    return [];
  }

  const response = await fetch(
    `https://www.kjornesodden.no/restauranter/${menu.slug}`
  );

  if (!response.ok) {
    throw new Error(`Kunne ikke hente menyen (${response.status}).`);
  }

  const html = await response.text();
  const products: Product[] = [];
  const sectionPattern = /<section[^>]*class="[^"]*menu-category[^"]*"[^>]*>([\s\S]*?)<\/section>/gi;
  let sectionMatch: RegExpExecArray | null;
  let categoryIndex = 0;

  while ((sectionMatch = sectionPattern.exec(html)) !== null) {
    const sectionHtml = sectionMatch[1];
    const category = decodeHtml(sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "Meny");
    const articlePattern = /<article[^>]*class="[^"]*dish[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
    let articleMatch: RegExpExecArray | null;
    let articleIndex = 0;

    while ((articleMatch = articlePattern.exec(sectionHtml)) !== null) {
      const articleHtml = articleMatch[1];
      const headingHtml = articleHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "";
      const cleanHeadingHtml = headingHtml.replace(/<span[\s\S]*?<\/span>/gi, "");
      const name = decodeHtml(cleanHeadingHtml);
      const description = decodeHtml(
        articleHtml.match(/<div[^>]*class="[^"]*dish-text[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? ""
      );
      const buttonPattern = /<button[^>]*class="[^"]*add-dish[^"]*"[^>]*>([\s\S]*?)<\/button>/gi;
      let buttonMatch: RegExpExecArray | null;
      let variantIndex = 0;

      while ((buttonMatch = buttonPattern.exec(articleHtml)) !== null) {
        const buttonHtml = buttonMatch[1];
        const variant = decodeHtml(buttonHtml.match(/<small[^>]*>([\s\S]*?)<\/small>/i)?.[1] ?? "");
        const buttonText = decodeHtml(buttonHtml);
        const priceMatch = buttonText.match(/(\d[\d\s]*)\s*kr/i);
        const price = Number((priceMatch?.[1] ?? "0").replace(/\s/g, ""));

        if (name && price > 0) {
          products.push({
            id: `website-${menu.slug}-${categoryIndex}-${articleIndex}-${variantIndex}`,
            restaurantId,
            name: variant ? `${name} – ${variant}` : name,
            description,
            price,
            imageData: "",
            available: true,
            category,
            sortOrder: products.length,
          });
        }

        variantIndex += 1;
      }

      articleIndex += 1;
    }

    categoryIndex += 1;
  }

  if (products.length === 0) {
    throw new Error("Nettsidemenyen var tom eller hadde et ukjent format.");
  }

  return products;
}


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
      (a.sortOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
      a.name.localeCompare(b.name)
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
