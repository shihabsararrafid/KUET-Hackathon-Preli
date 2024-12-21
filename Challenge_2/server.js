// server.js
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

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

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
