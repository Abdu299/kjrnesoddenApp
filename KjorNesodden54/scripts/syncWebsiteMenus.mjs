import { writeFile } from "node:fs/promises";

const restaurants = [
  ["signalen", "Signalen Sjøbad", ["signalen", "signalen sjøbad"]],
  ["tonys-sushi", "Tonys Sushi og Thai", ["tonys sushi", "tonys sushi og thai", "tony sushi"]],
  ["jafs", "JAFS Nesodden", ["jafs", "jafs nesodden"]],
  ["jonathan-sushi", "Jonathan Sushi", ["jonathan sushi", "jonathan"]],
  ["flaskebekk-bistro", "Flaskebekk Bistro", ["flaskebekk bistro", "flaskebekk"]],
  ["o-sole-mio", "O' Sole Mio", ["o sole mio", "o'sole mio", "o’ sole mio"]],
  ["mama-greek-kitchen", "Mama Greek Kitchen", ["mama greek kitchen", "mama greek kitchen fagerstrand"]],
];

const entities = { amp: "&", apos: "'", gt: ">", hellip: "…", laquo: "«", lt: "<", nbsp: " ", ndash: "–", quot: '"', raquo: "»", rsquo: "’" };

function clean(value) {
  return value.replace(/<[^>]*>/g, "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    return entities[entity.toLowerCase()] ?? `&${entity};`;
  }).replace(/\s+/g, " ").trim();
}

const menus = [];

for (const [slug, name, aliases] of restaurants) {
  const response = await fetch(`https://www.kjornesodden.no/restauranter/${slug}`);
  if (!response.ok) throw new Error(`${slug}: HTTP ${response.status}`);
  const html = await response.text();
  const categories = [];

  for (const sectionMatch of html.matchAll(/<section[^>]*class="[^"]*menu-category[^"]*"[^>]*>([\s\S]*?)<\/section>/gi)) {
    const sectionHtml = sectionMatch[1];
    const categoryName = clean(sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] ?? "Meny");
    const items = [];

    for (const articleMatch of sectionHtml.matchAll(/<article[^>]*class="[^"]*dish[^"]*"[^>]*>([\s\S]*?)<\/article>/gi)) {
      const articleHtml = articleMatch[1];
      const headingHtml = articleHtml.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? "";
      const itemName = clean(headingHtml.replace(/<span[\s\S]*?<\/span>/gi, ""));
      const description = clean(articleHtml.match(/<div[^>]*class="[^"]*dish-text[^"]*"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");

      for (const buttonMatch of articleHtml.matchAll(/<button[^>]*class="[^"]*add-dish[^"]*"[^>]*>([\s\S]*?)<\/button>/gi)) {
        const buttonHtml = buttonMatch[1];
        const variant = clean(buttonHtml.match(/<small[^>]*>([\s\S]*?)<\/small>/i)?.[1] ?? "");
        const price = Number((clean(buttonHtml).match(/(\d[\d\s]*)\s*kr/i)?.[1] ?? "0").replace(/\s/g, ""));
        if (itemName && price > 0) items.push({ name: variant ? `${itemName} – ${variant}` : itemName, description, price });
      }
    }

    categories.push({ name: categoryName, items });
  }

  menus.push({ slug, name, aliases, categories });
}

const output = `export type WebsiteMenuItem = { name: string; description: string; price: number };\nexport type WebsiteMenuCategory = { name: string; items: WebsiteMenuItem[] };\nexport type WebsiteRestaurantMenu = { slug: string; name: string; aliases: string[]; categories: WebsiteMenuCategory[] };\n\n// Generated from kjornesodden.no. Stored locally so menus work on web, iOS and Android.\nexport const WEBSITE_RESTAURANT_MENUS: WebsiteRestaurantMenu[] = ${JSON.stringify(menus, null, 2)};\n`;

await writeFile(new URL("../src/data/websiteMenus.ts", import.meta.url), output, "utf8");
console.log(`Saved ${menus.reduce((sum, menu) => sum + menu.categories.reduce((count, category) => count + category.items.length, 0), 0)} menu choices.`);
