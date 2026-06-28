// Convert recipe quantities between English and Metric units.
//
// Input system:
// - "english" leaves units unchanged
// - "metric" converts supported English units to metric units
//
// Supported conversions:
// - cup  -> mL / L
// - tbsp -> mL / L
// - tsp  -> mL / L
// - fl oz -> mL / L
// - oz   -> g / kg
// - lb   -> g / kg
//
// Smart metric behavior:
// - values >= 1000 g become kg
// - values < 1000 g stay g
// - values >= 1000 mL become L
// - values < 1000 mL stay mL

// Convert a quantity into a number when possible.
// Supports:
// - number
// - object with value
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

// Normalize unit text for comparison.
function normalizeUnit(unit) {
  return (unit || "").trim().toLowerCase();
}

// Round a number to two decimal places.
// Removes unnecessary floating point noise.
function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

// Smart metric mass display.
// Input is always grams.
function smartMetricMass(grams) {
  if (Math.abs(grams) >= 1000) {
    return {
      qty: roundToTwo(grams / 1000),
      unit: "kg"
    };
  }

  return {
    qty: Math.round(grams),
    unit: "g"
  };
}

// Smart metric volume display.
// Input is always mL.
function smartMetricVolume(mL) {
  if (Math.abs(mL) >= 1000) {
    return {
      qty: roundToTwo(mL / 1000),
      unit: "L"
    };
  }

  return {
    qty: Math.round(mL),
    unit: "mL"
  };
}

// Convert one item quantity and unit.
export function convertItemUnits(item, unitSystem) {

  // English is the stored/native recipe format, so no conversion is needed.
  if (unitSystem === "english") {
    return { ...item };
  }

  const unit = normalizeUnit(item.unit);
  const value = qtyToNumber(item.qty);

  // Preserve unsupported/non-numeric quantities unchanged.
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { ...item };
  }

  // ------------------------------
  // Existing metric mass units
  // ------------------------------

  if (unit === "g" || unit === "gram" || unit === "grams") {
    const converted = smartMetricMass(value);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (unit === "kg" || unit === "kilogram" || unit === "kilograms") {
    const converted = smartMetricMass(value * 1000);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  // ------------------------------
  // Existing metric volume units
  // ------------------------------

  if (unit === "ml" || unit === "milliliter" || unit === "milliliters") {
    const converted = smartMetricVolume(value);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (unit === "l" || unit === "liter" || unit === "liters") {
    const converted = smartMetricVolume(value * 1000);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  // ------------------------------
  // English volume conversions
  // ------------------------------

  if (unit === "cup" || unit === "cups") {
    const converted = smartMetricVolume(value * 240);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (unit === "tbsp" || unit === "tablespoon" || unit === "tablespoons") {
    const converted = smartMetricVolume(value * 15);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (unit === "tsp" || unit === "teaspoon" || unit === "teaspoons") {
    const converted = smartMetricVolume(value * 5);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (
    unit === "fl oz" ||
    unit === "fl. oz." ||
    unit === "fluid ounce" ||
    unit === "fluid ounces"
  ) {
    const converted = smartMetricVolume(value * 30);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  // ------------------------------
  // English mass conversions
  // ------------------------------

  if (unit === "oz" || unit === "ounce" || unit === "ounces") {
    const converted = smartMetricMass(value * 28.3495);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  if (unit === "lb" || unit === "lbs" || unit === "pound" || unit === "pounds") {
    const converted = smartMetricMass(value * 453.592);

    return {
      ...item,
      qty: converted.qty,
      unit: converted.unit
    };
  }

  // Unsupported units stay unchanged.
  return { ...item };
}

// Convert an array that may contain normal items or option groups.
function convertItemArray(items, unitSystem) {
  return (items || []).map((item) => {

    // Handle option groups.
    if (item.options) {
      return {
        ...item,
        options: item.options.map((option) =>
          convertItemUnits(option, unitSystem)
        )
      };
    }

    // Handle normal item.
    return convertItemUnits(item, unitSystem);
  });
}

// Convert a full recipe after scaling.
// Servings are intentionally not converted.
export function convertRecipeUnits(recipe, unitSystem) {
  return {
    ...recipe,

    ingredients: convertItemArray(recipe.ingredients || [], unitSystem),

    equipment: convertItemArray(recipe.equipment || [], unitSystem)
  };
}