import { formatQty } from "./engine/format.js";
import { scaleRecipe } from "./engine/scale.js";

let recipes = [];

async function loadRecipes() {
  const response = await fetch("./data/recipes.json");
  recipes = await response.json();

  render();
}

function render() {
  const search =
    document.getElementById("search").value.toLowerCase();

  const scale =
    parseFloat(document.getElementById("scale").value);

  const app =
    document.getElementById("app");

  app.innerHTML = "";

  recipes
    .filter(recipe =>
      recipe.name.toLowerCase().includes(search)
    )
    .forEach(recipe => {

      const scaled =
        scaleRecipe(recipe, scale);

      const card =
        document.createElement("div");

      card.className = "recipe";

      let html =
        `<h2>${scaled.name}</h2>`;

      html += "<h3>Ingredients</h3><ul>";

      scaled.ingredients.forEach(i => {
        html += `
          <li>
            ${formatQty(i.qty, i.unit)}
            ${i.name}
          </li>
        `;
      });

      html += "</ul>";

      html += "<h3>Instructions</h3><ol>";

      scaled.instructions.forEach(step => {
        html += `<li>${step}</li>`;
      });

      html += "</ol>";

      card.innerHTML = html;

      app.appendChild(card);
    });
}

document
  .getElementById("search")
  .addEventListener("input", render);

document
  .getElementById("applyScale")
  .addEventListener("click", render);

loadRecipes();