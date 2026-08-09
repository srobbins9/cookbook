import os
import json

RECIPES_DIR = "data/recipes"
OUTPUT_FILE = "data/recipes.json"

recipes = []

try:
    with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
        existing_index = {
            recipe["id"]: recipe
            for recipe in json.load(f)
            if "id" in recipe
        }
except (FileNotFoundError, json.JSONDecodeError):
    existing_index = {}

for filename in os.listdir(RECIPES_DIR):

    if not filename.endswith(".json"):
        continue

    filepath = os.path.join(RECIPES_DIR, filename)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        recipe_id = data.get("id", filename.replace(".json", ""))
        recipe_name = data.get("name", "Unnamed Recipe")
        existing = existing_index.get(recipe_id, {})

        recipes.append({
            "id": recipe_id,
            "name": recipe_name,
            "category": existing.get("category", "other"),
            "tags": existing.get("tags", []),
            "file": filepath.replace("\\", "/")
        })

    except Exception as e:
        print(f"Skipping {filename}: {e}")

# Sort by name
recipes.sort(key=lambda r: r["name"])

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(recipes, f, indent=2)

print(f"recipes.json updated with {len(recipes)} recipes.")
