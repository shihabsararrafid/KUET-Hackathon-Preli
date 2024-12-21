// server.js
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { saveImage } from "./lib/upload.js";
import path from "path";
import { extractTextFromImage } from "./lib/extractTextFromImage.js";
import { appendToRecipeFile } from "./lib/appendToRecipeFile.js";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
const genAI = new GoogleGenerativeAI("AIzaSyBESNbqOydAQWMvTdhZ0sdFj9ZOfTyIiSE");
async function parseRecipeText(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Parse the following recipe text into a structured JSON format with these fields:
    {
      "name": "Recipe name",
      "description": "Brief description",
      "cuisineType": "Type of cuisine",
      "prepTime": number (in minutes),
      "instructions": "Cooking instructions"
    }

    Format the response as valid JSON only, without any additional text or explanations.

    Recipe text to parse:
    ${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response || !response.text()) {
      throw new Error("No response from Gemini");
    }

    // Parse the response into JSON
    const parsedRecipe = JSON.parse(response.text());

    // Validate required fields
    if (!parsedRecipe.name) {
      throw new Error("Recipe name is required");
    }

    return parsedRecipe;
  } catch (error) {
    console.error("Error parsing recipe:", error);
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON returned from Gemini");
    }
    throw error;
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
};

// Ingredients Management Routes
app.post("/api/ingredients", async (req, res) => {
  try {
    const { name, quantity, unit, category, expiryDate } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: {
        name,
        quantity,
        unit,
        category,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });
    res.json(ingredient);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to add ingredient" });
  }
});
// Ingredients Management Routes
app.post("/api/ingredients/many", async (req, res) => {
  try {
    // Expect an array of ingredients in the request body
    const ingredients = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({
        error: "Request body should be an array of ingredients",
      });
    }

    // Create all ingredients in a single transaction
    const createdIngredients = await prisma.$transaction(
      ingredients.map((ingredient) => {
        const { name, quantity, unit, category, expiryDate } = ingredient;

        return prisma.ingredient.create({
          data: {
            name,
            quantity,
            unit,
            category,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
          },
        });
      })
    );

    res.json({
      success: true,
      count: createdIngredients.length,
      data: createdIngredients,
    });
  } catch (error) {
    console.error("Bulk ingredient creation error:", error);

    res.status(400).json({
      error: "Failed to add ingredients",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.patch("/api/ingredients/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit, expiryDate } = req.body;
    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: {
        quantity,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      },
    });
    res.json(ingredient);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update ingredient" });
  }
});

app.get("/api/ingredients", async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany();
    res.json(ingredients);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to fetch ingredients" });
  }
});
app.post("/api/add_recipe", upload.single("image"), async (req, res) => {
  try {
    let recipe;
    if (req.file) {
      // Extract text from image
      const image = await saveImage(req.file);

      recipe = await prisma.recipe.create({
        data: {
          recipeImage: image,
        },
      });
    } else {
      const { name, description, history, cuisineType, prepTime } = req.body;
      recipe = await prisma.recipe.create({
        data: {
          name,
          description,
          history,
          cuisineType,
          prepTime: prepTime ? parseInt(prepTime) : undefined,
        },
      });
    }
    // console.log(recipe);
    // const recipe = normalizeRecipeText(recipeText);
    // await saveRecipeToFile(recipe); // Or saveRecipeToDB(recipe);
    res.status(200).json({ message: "Recipe added successfully!", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add recipe." });
  }
});
app.get("/api/recipe_retrieval", async (req, res, next) => {
  try {
    const recipe = await prisma.recipe.findMany({
      where: {},
    });
    recipe.forEach(async (r) => {
      if (r.recipeImage) {
        const text = await extractTextFromImage(r.recipeImage);
        const s = parseRecipeText(text);
        appendToRecipeFile(s);
      } else appendToRecipeFile(r);
    });
    // if (recipe.recipeImage) {
    // }

    res.status(200).json({ message: "Recipe added successfully!", recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed retrieve." });
  }
});
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({
      error: "The 'message' field is required in the request body.",
    });
  }

  try {
    // 1. Get available ingredients from database
    const availableIngredients = await prisma.ingredient.findMany({
      where: {
        quantity: {
          gt: 0, // Only get ingredients with quantity > 0
        },
      },
      select: {
        name: true,
        quantity: true,
        unit: true,
      },
    });

    // 2. Read the recipe text file
    const recipeText = await fs.promises.readFile("my_fav_recipes.txt", "utf8");

    // 3. Create a context-aware prompt
    const prompt = `
    Available Ingredients:
    ${JSON.stringify(availableIngredients, null, 2)}

    Saved Recipes:
    ${recipeText}

    User Request: ${userMessage}

    Based on the available ingredients and saved recipes, please:
    1. Recommend recipes that can be made with the available ingredients
    2. For each recipe, specify:
       - What percentage of required ingredients we have
       - Which ingredients are missing (if any)
       - Any possible substitutions for missing ingredients
    3. If the user specifies preferences (like "something sweet" or "quick meal"), 
       prioritize recipes matching those preferences.

    Format your response in a clear, easy-to-read way.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (response && response.text) {
      res.json({
        response: response.text(),
        availableIngredients: availableIngredients,
      });
    } else {
      res.status(500).json({
        error: "No response generated",
        details: "The model did not generate any content",
      });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: "Error processing request",
      details: error.message,
      type: error.constructor.name,
    });
  }
});
app.use("/image", express.static(path.resolve("data/image")));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
