# Mofa's Kitchen Buddy API Documentation

A recipe management system that helps track ingredients and suggests recipes based on available items.

## Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start
```

## API Endpoints

### Ingredients Management

#### Add Single Ingredient

```http
POST /api/ingredients
Content-Type: application/json

{
    "name": "Chicken Breast",
    "quantity": 500.0,
    "unit": "grams",
    "category": "meat",
    "expiryDate": "2024-12-25T00:00:00.000Z"
}
```

#### Add Multiple Ingredients

```http
POST /api/ingredients/many
Content-Type: application/json

[
    {
        "name": "Chicken Breast",
        "quantity": 500.0,
        "unit": "grams",
        "category": "meat",
        "expiryDate": "2024-12-25T00:00:00.000Z"
    },
    {
        "name": "Olive Oil",
        "quantity": 750.0,
        "unit": "milliliters",
        "category": "oils",
        "expiryDate": "2025-06-30T00:00:00.000Z"
    }
]
```

#### Update Ingredient

```http
PATCH /api/ingredients/:id
Content-Type: application/json

{
    "quantity": 400.0,
    "unit": "grams",
    "expiryDate": "2024-12-26T00:00:00.000Z"
}
```

#### List Ingredients

```http
GET /api/ingredients
```

### Recipe Management

#### Add Recipe (Text)

```http
POST /api/add_recipe
Content-Type: application/json

{
    "name": "Spaghetti Carbonara",
    "description": "Classic Italian pasta dish",
    "history": "Originated in Rome",
    "cuisineType": "Italian",
    "prepTime": 30
}
```

#### Add Recipe (Image)

```http
POST /api/add_recipe
Content-Type: multipart/form-data

image: [image file]
```

#### Retrieve Recipes

```http
GET /api/recipe_retrieval
```

### Recipe Chatbot

#### Get Recipe Recommendations

```http
POST /chat
Content-Type: application/json

{
    "message": "I want to make something quick with chicken"
}
```

## Image Storage

Uploaded recipe images are stored in `data/image` directory and can be accessed via:

```http
GET /image/{filename}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL database connection string
