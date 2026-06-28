import os
import json

RECIPES_DIR = "data/recipes"
OUTPUT_FILE = "data/recipes.json"

recipes = []

for filename in os.listdir(RECIPES_DIR):

    if not filename.endswith(".json"):
        continue

    filepath = os.path.join(RECIPES_DIR, filename)

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        recipe_id = data.get("id", filename.replace(".json", ""))
        recipe_name = data.get("name", "Unnamed Recipe")

        recipes.append({
            "id": recipe_id,
            "name": recipe_name,
            "tags": data.get("tags", []),
            "file": filepath.replace("\\", "/")
        })

    except Exception as e:
        print(f"⚠️ Skipping {filename}: {e}")

# Sort by name
recipes.sort(key=lambda r: r["name"])

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(recipes, f, indent=2)

print(f"✅ recipes.json updated with {len(recipes)} recipes.")