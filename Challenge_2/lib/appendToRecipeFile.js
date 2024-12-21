import { appendFile } from "fs/promises";

export async function appendToRecipeFile(recipe) {
  const recipeText = `
  === Recipe: ${recipe.name} ===
  Description:${recipe.description}
  Cuisine Type: ${recipe.cuisineType || "Not specified"}
  Preparation Time: ${recipe.prepTime || "Not specified"} minutes
  Difficulty Level: ${recipe.difficultyLevel || "Not specified"}
  
  ===================================
  `;

  console.log(recipeText);
  try {
    await appendFile("my_fav_recipes.txt", recipeText);
  } catch (error) {
    console.error("Error writing to file:", error);
    throw error;
  }
}
