// Store recipe metadata from recipes.json in memory.
let recipes = [];

// Store categories from categories.json in memory.
let categories = [];

// Store tags from tags.json in memory.
let tags = [];

// Store selected tag filters in memory.
let selectedTags = new Set();

// Store current sort mode.
// Default is category.
let sortMode = "category";

// Load and parse a JSON file.
// If the file loads but contains invalid JSON, throw a clear error.
async function fetchJSON(path) {
  const res = await fetch(path);

  // Stop immediately if the file itself cannot be fetched.
  if (!res.ok) {
    throw new Error(`Failed to load: ${path}`);
  }

  // Try to parse JSON and surface a useful error if parsing fails.
  try {
    return await res.json();
  } catch (err) {
    throw new Error(`Invalid JSON in: ${path}`);
  }
}

// Convert an id like "blueberry-muffins" into "Blueberry muffins"
// as a fallback if a recipe name is missing.
function displayNameFromId(id) {
  if (!id) {
    return "Unnamed Recipe";
  }

  const txt = id.replace(/-/g, " ");

  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// Get category display name from categories.json.
// Falls back to "Other" if the category is missing or unknown.
function getCategoryName(categoryId) {
  const found = categories.find((category) => category.id === categoryId);

  if (found) {
    return found.name;
  }

  return "Other";
}

// Get tag display name from tags.json.
// Falls back to the tag id if the tag is missing from tags.json.
function getTagName(tagId) {
  const found = tags.find((tag) => tag.id === tagId);

  if (found) {
    return found.name;
  }

  return tagId;
}

// Validate that every tag used in recipes.json exists in tags.json.
// This does not stop the app. It only warns in the console.
function validateTags() {
  const validTags = new Set(tags.map((tag) => tag.id));

  recipes.forEach((recipe) => {
    recipe.tags.forEach((tag) => {
      if (!validTags.has(tag)) {
        console.warn(`Unknown tag "${tag}" in recipe "${recipe.id}"`);
      }
    });
  });
}

// Get all tag ids actually used by recipes.json.
function getUsedTagIds() {
  const used = new Set();

  recipes.forEach((recipe) => {
    recipe.tags.forEach((tag) => {
      used.add(tag);
    });
  });

  return used;
}

// Get tags that should be displayed in the filter panel.
// Order follows tags.json, but unused tags are hidden.
function getVisibleTags() {
  const usedTagIds = getUsedTagIds();

  return tags.filter((tag) => usedTagIds.has(tag.id));
}

// Load recipes.json, categories.json, and tags.json.
async function loadRecipes() {
  try {
    // Load recipe metadata, category metadata, and tag metadata in parallel.
    const [recipeIndex, categoryIndex, tagIndex] = await Promise.all([
      fetchJSON("./data/recipes.json"),
      fetchJSON("./data/categories.json"),
      fetchJSON("./data/tags.json")
    ]);

    // Store categories in the order defined by categories.json.
    categories = Array.isArray(categoryIndex) ? categoryIndex : [];

    // Store tags in the order defined by tags.json.
    tags = Array.isArray(tagIndex) ? tagIndex : [];

    // Use recipes.json as the homepage source of truth.
    recipes = recipeIndex.map((entry) => {
      return {
        id: entry.id,
        name: entry.name || displayNameFromId(entry.id),
        category: entry.category || "other",
        tags: Array.isArray(entry.tags) ? entry.tags : [],
        file: entry.file
      };
    });

    // Warn if recipes.json uses tags that are missing from tags.json.
    validateTags();

    // Build the tag filter UI after recipes and tags are loaded.
    renderTagPanel();

    // Render the homepage list.
    renderList();

  } catch (err) {
    console.error(err);

    const app = document.getElementById("app");

    if (app) {
      app.innerHTML = `<p>Error loading recipes: ${err.message}</p>`;
    }
  }
}

// Render the hidden/shown tag filter panel.
function renderTagPanel() {
  const tagPanel = document.getElementById("tagPanel");

  if (!tagPanel) {
    return;
  }

  const visibleTags = getVisibleTags();

  // Clear previous panel contents.
  tagPanel.innerHTML = "";

  // If there are no used tags, keep the panel hidden.
  if (visibleTags.length === 0) {
    tagPanel.hidden = true;
    return;
  }

  // Header
  const heading = document.createElement("h3");
  heading.textContent = "Filter Tags";
  tagPanel.appendChild(heading);

  // Clear button directly under header.
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Tags";

  clearBtn.onclick = () => {
    selectedTags.clear();
    renderTagPanel();
    renderList();
  };

  tagPanel.appendChild(clearBtn);

  // Tag checkboxes.
  // These are intentionally divs, not ul/li,
  // because the checkboxes visually act like bullets.
  const tagList = document.createElement("div");
  tagList.className = "tag-filter-list";

  visibleTags.forEach((tag) => {
    const row = document.createElement("div");
    row.className = "tag-filter-row";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = tag.id;
    checkbox.checked = selectedTags.has(tag.id);

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedTags.add(tag.id);
      } else {
        selectedTags.delete(tag.id);
      }

      renderList();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" " + getTagName(tag.id)));

    row.appendChild(label);
    tagList.appendChild(row);
  });

  tagPanel.appendChild(tagList);
}

// Return true if a recipe matches currently selected tags.
//
// Current behavior:
// - no selected tags => all recipes match
// - one or more selected tags => recipe matches if it has ANY selected tag
function recipeMatchesSelectedTags(recipe) {
  if (selectedTags.size === 0) {
    return true;
  }

  return recipe.tags.some((tag) => selectedTags.has(tag));
}

// Return recipes after applying search and tag filters.
function getFilteredRecipes() {
  const searchInput = document.getElementById("search");
  const search = searchInput ? searchInput.value.toLowerCase().trim() : "";

  return recipes.filter((recipe) => {

    // Search filters recipe names only.
    const matchesSearch =
      !search ||
      recipe.name.toLowerCase().includes(search);

    // Tag filter uses OR logic.
    const matchesTags = recipeMatchesSelectedTags(recipe);

    return matchesSearch && matchesTags;
  });
}

// Render one clickable recipe link.
function renderRecipeLink(recipe) {
  const li = document.createElement("li");
  const link = document.createElement("span");

  link.textContent = recipe.name;
  link.className = "recipe-link";

  link.onclick = () => {
    window.location.href = `recipe.html?recipe=${recipe.id}`;
  };

  li.appendChild(link);

  return li;
}

// Render recipes alphabetically by name.
function renderByName(filteredRecipes, app) {
  const sorted = filteredRecipes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  const ul = document.createElement("ul");

  sorted.forEach((recipe) => {
    ul.appendChild(renderRecipeLink(recipe));
  });

  app.appendChild(ul);
}

// Render recipes grouped by category order from categories.json.
function renderByCategory(filteredRecipes, app) {
  const categoryIdsInOrder = categories.map((category) => category.id);

  // Make sure "other" exists as a fallback group.
  if (!categoryIdsInOrder.includes("other")) {
    categoryIdsInOrder.push("other");
  }

  categoryIdsInOrder.forEach((categoryId) => {
    const recipesInCategory = filteredRecipes
      .filter((recipe) => {
        const recipeCategory = recipe.category || "other";

        // Unknown categories go under Other.
        if (categoryId === "other") {
          return (
            recipeCategory === "other" ||
            !categoryIdsInOrder.includes(recipeCategory)
          );
        }

        return recipeCategory === categoryId;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // Hide categories with no matching recipes.
    if (recipesInCategory.length === 0) {
      return;
    }

    const heading = document.createElement("h3");
    heading.textContent = getCategoryName(categoryId);
    app.appendChild(heading);

    const ul = document.createElement("ul");

    recipesInCategory.forEach((recipe) => {
      ul.appendChild(renderRecipeLink(recipe));
    });

    app.appendChild(ul);
  });
}

// Render the filtered recipe list on the homepage.
function renderList() {
  const app = document.getElementById("app");

  if (!app) {
    return;
  }

  const filtered = getFilteredRecipes();

  app.innerHTML = "";

  if (filtered.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No recipes found.";
    app.appendChild(none);
    return;
  }

  if (sortMode === "category") {
    renderByCategory(filtered, app);
  } else {
    renderByName(filtered, app);
  }
}

// Toggle the tag filter panel.
function initFilterButton() {
  const filterBtn = document.getElementById("filterBtn");
  const tagPanel = document.getElementById("tagPanel");

  if (!filterBtn || !tagPanel) {
    return;
  }

  filterBtn.onclick = () => {
    tagPanel.hidden = !tagPanel.hidden;
  };
}

// Toggle between sorting by category and sorting by name.
function initSortButton() {
  const sortBtn = document.getElementById("sortBtn");

  if (!sortBtn) {
    return;
  }

  // Default is category.
  sortMode = "category";
  sortBtn.textContent = "Sort by: Category";

  sortBtn.onclick = () => {
    if (sortMode === "category") {
      sortMode = "name";
      sortBtn.textContent = "Sort by: Name";
    } else {
      sortMode = "category";
      sortBtn.textContent = "Sort by: Category";
    }

    renderList();
  };
}

// Init event listeners.
function initControls() {
  const searchInput = document.getElementById("search");

  if (searchInput) {
    searchInput.addEventListener("input", renderList);
  }

  initSortButton();
  initFilterButton();
}

// Initialize controls and load data.
initControls();
loadRecipes();