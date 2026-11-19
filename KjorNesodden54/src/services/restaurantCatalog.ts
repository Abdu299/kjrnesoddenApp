function normalizedName(name: string) {
  return name.trim().toLocaleLowerCase("nb-NO").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ø/g, "o").replace(/[^a-z0-9]/g, "");
}

export function isFagerstrandGrill(name: string) {
  return ["fagerstrandgrill", "fagerstrandgrillnesodden"].includes(normalizedName(name));
}

export function sortRestaurants<T extends { name: string }>(restaurants: T[]): T[] {
  const priority = (name: string) => ["signalen", "signalensjobad"].includes(normalizedName(name)) ? 0 : 1;
  return [...restaurants].sort((a, b) => priority(a.name) - priority(b.name) || a.name.localeCompare(b.name, "nb-NO"));
}
