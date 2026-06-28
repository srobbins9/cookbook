// Convert a quantity into a number when possible.
// Supports:
// - number
// - object with int / num / den
function qtyToNumber(qty) {
  if (typeof qty === "number") {
    return qty;
  }

  if (qty && typeof qty === "object") {
    if (typeof qty.value === "number") {
      return qty.value;
    }

    const int = typeof qty.int === "number" ? qty.int : 0;
    const num = typeof qty.num === "number" ? qty.num : 0;
    const den = typeof qty.den === "number" && qty.den !== 0 ? qty.den : 1;

    return int + num / den;
  }

  return qty;
}

// Format a mixed fraction as plain text.
// Examples:
// { int: 1, num: 1, den: 2 } -> "1 1/2"
// { int: 0, num: 1, den: 2 } -> "1/2"
function formatMixed(qty) {
  const int = typeof qty.int === "number" ? qty.int : 0;
  const num = typeof qty.num === "number" ? qty.num : 0;
  const den = typeof qty.den === "number" && qty.den !== 0 ? qty.den : 1;

  if (num === 0) {
    return String(int);
  }

  if (int === 0) {
    return `${num}/${den}`;
  }

  return `${int} ${num}/${den}`;
}

function normalizeDisplayUnit(unit) {
  const u = (unit || "").trim().toLowerCase();

  if (u === "ml") return "mL";
  if (u === "l") return "L";

  return unit;
}

// Pluralize unit text.
// This must respect your preferred unit rules.
function pluralizeUnit(unit, qty) {
  const normalizedUnit = (unit || "").trim().toLowerCase();

  if (!normalizedUnit) {
    return "";
  }

  // If scale.js already returned a ready-to-display string,
  // do not append any unit text.
  if (qty && typeof qty === "object" && typeof qty.display === "string") {
    return "";
  }

  const val = qtyToNumber(qty);

  // Leave unchanged if quantity is not numeric
  if (typeof val !== "number" || !Number.isFinite(val)) {
    return unit;
  }

  // Use singular/base form for <= 1
  if (val <= 1) {
    return unit;
  }

// Units that should NOT change when plural
if (
  normalizedUnit === "tsp" ||
  normalizedUnit === "tbsp" ||
  normalizedUnit === "oz" ||
  normalizedUnit === "g" ||
  normalizedUnit === "kg" ||
  normalizedUnit === "ml" ||
  normalizedUnit === "l" ||
  normalizedUnit === "fl oz"
) {
  return unit;
}

// Explicit plural rules
if (normalizedUnit === "cup") return "cups";

// Default
return `${unit}s`;
}

// Public formatter used by recipe.html.
// Supports:
// - prebuilt display strings from scale.js
// - decimal numbers
// - mixed fraction objects
export function formatQty(qty, unit = "") {
  if (qty === null || qty === undefined || qty === "") {
    return "";
  }

  // If scale.js already produced the exact display text, use it directly
  if (qty && typeof qty === "object" && typeof qty.display === "string") {
    return qty.display;
  }

  let formattedQty = "";

  // Decimal number
  if (typeof qty === "number") {
    formattedQty = Number.isInteger(qty)
      ? String(qty)
      : String(parseFloat(qty.toFixed(2)));
  }

  // Mixed fraction object
  else if (typeof qty === "object") {
    formattedQty = formatMixed(qty);
  }

  // Fallback
  else {
    formattedQty = String(qty);
  }

const unitText = normalizeDisplayUnit(pluralizeUnit(unit, qty));

  if (!unitText) {
    return formattedQty;
  }

  return `${formattedQty} ${unitText}`;
}
