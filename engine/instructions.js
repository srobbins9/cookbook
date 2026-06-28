import { formatQty } from "./format.js";

// Convert a quantity into a number when possible.
// Supports:
// - number
// - object with value
// - object with int / num / den
export function qtyToNumber(qty) {
  if (typeof qty === "number") {
    return qty;
  }

  if (qty && typeof qty === "object") {
    if (typeof qty.value === "number") {
      return qty.value;
    }

    const int = qty.int || 0;
    const num = qty.num || 0;
    const den = qty.den || 1;

    return int + num / den;
  }

  return qty;
}

// Get the display name for an ingredient or equipment item.
export function getDisplayName(item) {
  return item.name || item.id;
}

// Auto-generate a plural display name when no explicit plural is provided.
function autoPluralizeName(name) {
  const words = name.trim().split(/\s+/);

  if (words.length === 0) {
    return name;
  }

  const lastIndex = words.length - 1;
  const lastWord = words[lastIndex];
  const lower = lastWord.toLowerCase();

  let pluralWord;

  // Words ending in consonant + y:
  // berry -> berries
  // cherry -> cherries
  if (
    lower.endsWith("y") &&
    !["a", "e", "i", "o", "u"].includes(lower.charAt(lower.length - 2))
  ) {
    pluralWord = lastWord.slice(0, -1) + "ies";
  }

  // Words ending in s, x, z, ch, or sh:
  // glass -> glasses
  // box -> boxes
  // dish -> dishes
  else if (
    lower.endsWith("s") ||
    lower.endsWith("x") ||
    lower.endsWith("z") ||
    lower.endsWith("ch") ||
    lower.endsWith("sh")
  ) {
    pluralWord = lastWord + "es";
  }

  // Default:
  // pan -> pans
  // egg -> eggs
  // liner -> liners
  else {
    pluralWord = lastWord + "s";
  }

  words[lastIndex] = pluralWord;

  return words.join(" ");
}

// Get the plural display name for an ingredient or equipment item.
export function getPluralName(item, qty) {

  const value = qtyToNumber(qty);

  // Singular case
  if (!value || Math.abs(value - 1) < 1e-6) {
    return getDisplayName(item);
  }

  // Explicit "no plural" override
  if (item.plural === false) {
    return getDisplayName(item);
  }

  // Explicit plural string override
  if (typeof item.plural === "string") {
    return item.plural;
  }

  // Auto plural fallback
  return autoPluralizeName(getDisplayName(item));
}

// Format one item for instruction placeholder replacement.
function formatInstructionItem(item, mode, defaultMode) {

  const actualMode = mode || defaultMode;

  if (actualMode === "name") {
    return getDisplayName(item);
  }

  if (actualMode === "qty") {
    return formatQty(item.qty);
  }

  if (actualMode === "unit") {
    return item.unit || "";
  }

  if (actualMode === "full") {
    const qtyText = formatQty(item.qty, item.unit || "");
    const nameText = getPluralName(item, item.qty);

    return `${qtyText} ${nameText}`.trim();
  }

  return getDisplayName(item);
}

// Expand placeholders in instruction text.
//    {item-id}       --> name only
//    {item-id:full}  --> quantity + unit + name
//    {item-id:name}  --> name only
//    {item-id:qty}   --> quantity only
//    {item-id:unit}  --> unit only, if present
export function expandInstruction(text, ingredients, equipment) {
  return text.replace(/{(.*?)}/g, (_, rawKey) => {

    const parts = rawKey.split(":");
    const key = parts[0].trim();
    const mode = parts[1] ? parts[1].trim().toLowerCase() : "";

    const ing = ingredients.find(i => i.id === key);
    if (ing) {
      // ✅ default now = name
      return formatInstructionItem(ing, mode, "name");
    }

    const eq = equipment.find(e => e.id === key);
    if (eq) {
      // ✅ default now = name
      return formatInstructionItem(eq, mode, "name");
    }

    return `{${rawKey}}`;
  });
}