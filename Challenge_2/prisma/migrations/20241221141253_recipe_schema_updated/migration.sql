-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "history" DROP NOT NULL,
ALTER COLUMN "recipeImage" DROP NOT NULL;