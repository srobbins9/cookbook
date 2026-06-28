// Validate the requested scale factor.
// If invalid, fall back to 1.
function sanitizeFactor(factor) {
  // Reject non-numeric, non-finite, or non-positive values.
  if (typeof factor !== "number" || !Number.isFinite(factor) || factor <= 0) {
    return 1;
  }

  // Otherwise return the provided factor.
  return factor;
}

// Compute the greatest common divisor.
// Used to reduce fractions.
function gcd(a, b) {
  // Standard Euclidean algorithm.
  return b ? gcd(b, a % b) : a;
}

// Convert a supported quantity into a numeric value.
// Supported:
// - number
// - object with int / num / den
function qtyToNumber(qty) {
  // Already numeric.
  if (typeof qty === "number") {
    return qty;
  }

  // Mixed fraction object.
  if (qty && typeof qty === "object") {
    // Whole number portion.
    const int = typeof qty.int === "number" ? qty.int : 0;

    // Fraction numerator.
    const num = typeof qty.num === "number" ? qty.num : 0;

    // Fraction denominator.
    const den = typeof qty.den === "number" && qty.den !== 0 ? qty.den : 1;

    // Return the numeric equivalent.
    return int + num / den;
  }

  // Fallback for unsupported types.
  return qty;
}

// Round a value to the nearest increment.
// Example:
// roundToIncrement(1.27, 0.25) -> 1.25
function roundToIncrement(value, increment) {
  // Snap to nearest increment.
  return Math.round(value / increment) * increment;
}

// Convert a decimal number into a mixed fraction object.
// Example:
// 1.5 -> { int: 1, num: 1, den: 2 }
function numberToMixedFraction(value, maxDen = 4, tol = 0.05) {
  // Whole-number portion.
  const whole = Math.floor(value);

  // Fractional remainder.
  const decimal = value - whole;

  // If effectively whole already, return whole only.
  if (decimal < Number.EPSILON) {
    return { int: whole, num: 0, den: 1 };
  }

  // Track the best fraction match.
  let bestNum = 0;
  let bestDen = 1;
  let bestError = Infinity;

  // Search for the cleanest denominator up to maxDen.
  for (let den = 2; den <= maxDen; den++) {
    // Candidate numerator.
    const num = Math.round(decimal * den);

    // Candidate fraction value.
    const approx = num / den;

    // Error from the true decimal.
    const error = Math.abs(decimal - approx);

    // Keep the closest match.
    if (error < bestError) {
      bestError = error;
      bestNum = num;
      bestDen = den;
    }
  }

  // If no clean fraction is close enough, fall back to a decimal.
  if (bestError > tol) {
    return Math.round(value * 100) / 100;
  }

  // Reduce the fraction.
  const d = gcd(bestNum, bestDen);

  // Reduced numerator.
  let num = bestNum / d;

  // Reduced denominator.
  let den = bestDen / d;

  // Whole number portion.
  let int = whole;

  // Handle cases like 4/4 -> 1.
  if (num === den) {
    int += 1;
    num = 0;
    den = 1;
  }

  // Return mixed fraction object.
  return { int, num, den };
}

// Format a baking-style value that originated in cups.
// Rules:
// - express as many whole / quarter cups as possible
// - then use tbsp in 1/2 tbsp increments
// - then use tsp in 1/4 tsp increments for any tiny leftover
//
// Examples:
// 1.25 -> "1 1/4 cups"
// 1.30 -> "1 1/4 cups + 1 tbsp"
// 1.02 -> "1 cup + 1 tsp"
// 0.03 -> "1 1/2 tsp"
function formatBakingValue(valueInCups) {
  // Start with the whole cups.
  const wholeCups = Math.floor(valueInCups);

  // Compute the fractional remainder in cups.
  let remainingCups = valueInCups - wholeCups;

  // Express as much of the remainder as possible in quarter-cups.
  const quarterCupCount = Math.floor(remainingCups / 0.25);

  // Compute the quarter-cup portion in cups.
  const quarterCupValue = quarterCupCount * 0.25;

  // Remove the quarter-cup portion from the remaining cups.
  remainingCups -= quarterCupValue;

  // Build the cup display portion.
  let cupText = "";

  // If we have any whole or quarter-cup portion, format it.
  if (wholeCups > 0 || quarterCupValue > 0) {
    // Recombine the cup portion.
    const cupPortion = wholeCups + quarterCupValue;

    // Convert to mixed fraction in quarter-cup increments.
    const cupFraction = numberToMixedFraction(cupPortion, 4, 0.001);

    // If fallback returned a plain number, format directly.
    if (typeof cupFraction === "number") {
      cupText = `${cupFraction} cup${cupFraction === 1 ? "" : "s"}`;
    } else {
      // Whole number portion.
      const int = cupFraction.int || 0;

      // Numerator.
      const num = cupFraction.num || 0;

      // Denominator.
      const den = cupFraction.den || 1;

      // Whole cups only.
      if (num === 0) {
        cupText = `${int} cup${int === 1 ? "" : "s"}`;
      }

      // Fraction-only cups.
      else if (int === 0) {
        cupText = `${num}/${den} cup`;
      }

      // Mixed fraction cups.
      else {
        cupText = `${int} ${num}/${den} cups`;
      }
    }
  }

  // Convert the remaining cup fraction into tablespoons.
  let remainingTbsp = remainingCups * 16;

  // Snap tbsp to the nearest 1/2 tbsp.
  const roundedTbsp = roundToIncrement(remainingTbsp, 0.5);

  // If the remainder is at least 1/2 tbsp, use tbsp.
  if (roundedTbsp >= 0.5) {
    // Convert rounded tbsp into a mixed fraction text.
    const tbspFraction = numberToMixedFraction(roundedTbsp, 2, 0.001);

    // Build the tbsp display portion.
    let tbspText = "";

    // If fallback returned a number, format directly.
    if (typeof tbspFraction === "number") {
      tbspText = `${tbspFraction} tbsp`;
    } else {
      // Whole number portion.
      const int = tbspFraction.int || 0;

      // Numerator.
      const num = tbspFraction.num || 0;

      // Denominator.
      const den = tbspFraction.den || 1;

      // Whole tbsp only.
      if (num === 0) {
        tbspText = `${int} tbsp`;
      }

      // Fraction-only tbsp.
      else if (int === 0) {
        tbspText = `${num}/${den} tbsp`;
      }

      // Mixed fraction tbsp.
      else {
        tbspText = `${int} ${num}/${den} tbsp`;
      }
    }

    // If no cup text exists, return only tbsp.
    if (!cupText) {
      return tbspText;
    }

    // Otherwise return combined cups + tbsp.
    return `${cupText} + ${tbspText}`;
  }

  // Convert any tiny leftover to tsp.
  const remainingTsp = roundToIncrement(remainingCups * 48, 0.25);

  // If no tsp remains, just return the cup portion.
  if (remainingTsp < 0.25) {
    return cupText || "0";
  }

  // Convert tsp to mixed fraction text.
  const tspFraction = numberToMixedFraction(remainingTsp, 4, 0.001);

  // Build tsp display portion.
  let tspText = "";

  // If fallback returned a plain number, format directly.
  if (typeof tspFraction === "number") {
    tspText = `${tspFraction} tsp`;
  } else {
    // Whole number portion.
    const int = tspFraction.int || 0;

    // Numerator.
    const num = tspFraction.num || 0;

    // Denominator.
    const den = tspFraction.den || 1;

    // Whole tsp only.
    if (num === 0) {
      tspText = `${int} tsp`;
    }

    // Fraction-only tsp.
    else if (int === 0) {
      tspText = `${num}/${den} tsp`;
    }

    // Mixed fraction tsp.
    else {
      tspText = `${int} ${num}/${den} tsp`;
    }
  }

  // If no cup text exists, return only tsp.
  if (!cupText) {
    return tspText;
  }

  // Otherwise return combined cups + tsp.
  return `${cupText} + ${tspText}`;
}

// Convert either a number or mixed fraction object into display text.
// Used by unit-aware baking formatting.
function formatAmountText(value, maxDen = 4) {
  const mixed = numberToMixedFraction(value, maxDen, 0.001);

  if (typeof mixed === "number") {
    return String(mixed);
  }

  const int = mixed.int || 0;
  const num = mixed.num || 0;
  const den = mixed.den || 1;

  if (num === 0) {
    return String(int);
  }

  if (int === 0) {
    return `${num}/${den}`;
  }

  return `${int} ${num}/${den}`;
}

// Format a tablespoon quantity without automatically promoting small amounts to cups.
// Example:
// 2 tbsp -> "2 tbsp"
// 16 tbsp -> handled by formatBakingQuantity as "1 cup"
function formatTablespoons(valueInTbsp) {
  const roundedTbsp = roundToIncrement(valueInTbsp, 0.25);

  if (roundedTbsp < 0.25) {
    return "0";
  }

  return `${formatAmountText(roundedTbsp, 4)} tbsp`;
}

// Format a teaspoon quantity without automatically promoting small amounts too aggressively.
// Example:
// 2 tsp -> "2 tsp"
function formatTeaspoons(valueInTsp) {
  const roundedTsp = roundToIncrement(valueInTsp, 0.25);

  if (roundedTsp < 0.25) {
    return "0";
  }

  return `${formatAmountText(roundedTsp, 4)} tsp`;
}

// Format teaspoons as tablespoons + teaspoons when that improves readability.
// Example:
// 6 tsp -> "2 tbsp"
// 7 tsp -> "2 tbsp + 1 tsp"
function formatTspAsTbspAndTsp(valueInTsp) {
  const roundedTsp = roundToIncrement(valueInTsp, 0.25);

  const wholeTbsp = Math.floor(roundedTsp / 3);
  const remainingTsp = roundedTsp - wholeTbsp * 3;

  let parts = [];

  if (wholeTbsp > 0) {
    parts.push(`${formatAmountText(wholeTbsp, 4)} tbsp`);
  }

  if (remainingTsp >= 0.25) {
    parts.push(formatTeaspoons(remainingTsp));
  }

  return parts.join(" + ") || "0";
}

// Smart baking formatter that respects the original unit.
//
// Important rules:
// - cup quantities use the existing cup -> tbsp -> tsp display.
// - tbsp quantities stay in tbsp unless they reach at least 1 cup.
// - tsp quantities stay in tsp unless tbsp or cup improves readability.
function formatBakingQuantity(value, unit) {
  const normalizedUnit = (unit || "").trim().toLowerCase();

  // Cup-based quantities can use the existing cup/tbsp/tsp formatter.
  if (normalizedUnit === "cup" || normalizedUnit === "cups") {
    return formatBakingValue(value);
  }

  // Tablespoon-based quantities stay in tbsp unless they reach at least 1 cup.
  if (
    normalizedUnit === "tbsp" ||
    normalizedUnit === "tablespoon" ||
    normalizedUnit === "tablespoons"
  ) {
    if (value >= 16) {
      return formatBakingValue(value / 16);
    }

    return formatTablespoons(value);
  }

  // Teaspoon-based quantities stay in tsp unless tbsp or cup improves readability.
  if (
    normalizedUnit === "tsp" ||
    normalizedUnit === "teaspoon" ||
    normalizedUnit === "teaspoons"
  ) {
    if (value >= 48) {
      return formatBakingValue(value / 48);
    }

    if (value >= 3) {
      return formatTspAsTbspAndTsp(value);
    }

    return formatTeaspoons(value);
  }

  // Unsupported units fall back to a clean mixed-fraction value without changing units.
  return formatAmountText(value, 4);
}

// Parse the scale method string.
// Supported:
// - fixed
// - baking
// - multiple_#_direction
// - decimal_#_direction
// - fraction_#_direction
function parseScaleMethod(method) {
  // Handle special methods with no numeric parameter.
  if (method === "fixed" || method === "baking") {
    return {
      type: method,
      amount: null,
      direction: null
    };
  }

  // Split into parts.
  const parts = method.split("_");

  // Require exactly three parts.
  if (parts.length !== 3) {
    return null;
  }

  // Parse type.
  const type = parts[0];

  // Parse numeric amount.
  const amount = Number(parts[1]);

  // Parse direction.
  const direction = parts[2];

  // Validate numeric amount.
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    type,
    amount,
    direction
  };
}

// Apply one scaling method to a numeric value.
function applyScale(value, method, originalQty, unit) {
  // Parse the method definition.
  const parsed = parseScaleMethod(method);

  // If invalid, fall back to quarter-fraction rounding.
  if (!parsed) {
    const fallbackRounded = roundToIncrement(value, 0.25);
    return numberToMixedFraction(fallbackRounded, 4, 0.001);
  }

  // Fixed quantities do not scale at all.
  if (parsed.type === "fixed") {
    return originalQty;
  }

  // Baking method uses smart unit-aware formatting.
  // This prevents small tbsp/tsp amounts from incorrectly becoming cups.
  if (parsed.type === "baking") {
    return { display: formatBakingQuantity(value, unit) };
  }

  // Multiple-based rounding.
  if (parsed.type === "multiple") {
    // Step size.
    const step = parsed.amount;

    // Round up to nearest multiple.
    if (parsed.direction === "up") {
      return Math.ceil(value / step) * step;
    }

    // Round down to nearest multiple.
    if (parsed.direction === "down") {
      return Math.floor(value / step) * step;
    }

    // Standard nearest rounding.
    return Math.round(value / step) * step;
  }

  // Decimal place rounding.
  if (parsed.type === "decimal") {
    // Decimal precision factor.
    const factor = Math.pow(10, parsed.amount);

    // Round up.
    if (parsed.direction === "up") {
      return Math.ceil(value * factor) / factor;
    }

    // Round down.
    if (parsed.direction === "down") {
      return Math.floor(value * factor) / factor;
    }

    // Standard rounded.
    return Math.round(value * factor) / factor;
  }

  // Fraction snapping.
  if (parsed.type === "fraction") {
    // Snap increment is 1 / amount.
    const increment = 1 / parsed.amount;

    let snapped;

    // Snap up.
    if (parsed.direction === "up") {
      snapped = Math.ceil(value / increment) * increment;
    }

    // Snap down.
    else if (parsed.direction === "down") {
      snapped = Math.floor(value / increment) * increment;
    }

    // Snap to nearest.
    else {
      snapped = Math.round(value / increment) * increment;
    }

    // Return as mixed fraction.
    return numberToMixedFraction(snapped, parsed.amount, 0.001);
  }

  // Final fallback.
  const fallbackRounded = roundToIncrement(value, 0.25);
  return numberToMixedFraction(fallbackRounded, 4, 0.001);
}

// Scale one item that has a qty and optional scale_method.
// Used for ingredients, equipment, and servings.
function scaleItem(item, factor) {
  // Convert quantity into numeric form.
  const numericQty = qtyToNumber(item.qty);

  // Preserve non-numeric quantities unchanged.
  if (typeof numericQty !== "number" || !Number.isFinite(numericQty)) {
    return { ...item };
  }

  // Use explicit method if present.
  // Otherwise fall back to:
  // - multiple_1_up for unitless items
  // - fraction_4_rounded for everything else
  let method = item.scale_method;

  if (!method) {
    const normalizedUnit = (item.unit || "").trim().toLowerCase();

    if (!normalizedUnit) {
      method = "multiple_1_up";
    } else {
      method = "fraction_4_rounded";
    }
  }

  // Fixed quantities use the original value.
  if (method === "fixed") {
    return {
      ...item,
      qty: item.qty
    };
  }

  // Scale the numeric value.
  const scaledValue = numericQty * factor;

  // Apply the method.
  const finalQty = applyScale(scaledValue, method, item.qty, item.unit);

  // Store numeric value on object quantities so rendering/plural logic
  // can still know the scaled amount.
  if (finalQty && typeof finalQty === "object") {
    return {
      ...item,
      qty: {
        ...finalQty,
        value: scaledValue
      }
    };
  }

  return {
    ...item,
    qty: finalQty
  };
}

// Scale the recipe.
// If an item has an explicit scale_method, use it.
// Otherwise use the unit-based fallback defaults.
export function scaleRecipe(recipe, factor) {
  // Normalize the requested scale factor.
  const safeFactor = sanitizeFactor(factor);

  return {
    ...recipe,

    servings: recipe.servings
      ? scaleItem(recipe.servings, safeFactor)
      : recipe.servings,

    equipment: (recipe.equipment || []).map((equipment) =>
      scaleItem(equipment, safeFactor)
    ),

    ingredients: recipe.ingredients.map((ingredient) =>
      scaleItem(ingredient, safeFactor)
    )
  };
}