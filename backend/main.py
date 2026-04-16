from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os

from backend.database import get_db, engine, Base
from backend.models import Recipe
from backend.schemas import ExtractRequest, RecipeResponse
from backend.scraper import scrape_recipe_page
from backend.llm_extractor import extract_recipe_data

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Recipe Extractor & Meal Planner API")

def normalize_recipe_data(data: dict, url: str) -> dict:
    servings_val = data.get("servings", 0)
    try:
        servings = int(servings_val)
    except (ValueError, TypeError):
        servings = 0

    ingredients = data.get("ingredients") or []
    if not isinstance(ingredients, list):
        ingredients = []

    instructions = data.get("instructions") or []
    if not isinstance(instructions, list):
        instructions = []

    substitutions = data.get("substitutions") or []
    if not isinstance(substitutions, list):
        substitutions = []

    shopping_list = data.get("shopping_list") or {}
    if not isinstance(shopping_list, dict):
        shopping_list = {}

    related_recipes = data.get("related_recipes") or []
    if not isinstance(related_recipes, list):
        related_recipes = []

    nutrition_estimate = data.get("nutrition_estimate") or {}
    if not isinstance(nutrition_estimate, dict):
        nutrition_estimate = {}

    return {
        "url": url,
        "title": data.get("title") or "Unknown",
        "cuisine": data.get("cuisine") or "Unknown",
        "prep_time": data.get("prep_time") or "N/A",
        "cook_time": data.get("cook_time") or "N/A",
        "total_time": data.get("total_time") or "N/A",
        "servings": servings,
        "difficulty": data.get("difficulty") or "Unknown",
        "ingredients": ingredients,
        "instructions": instructions,
        "nutrition_estimate": nutrition_estimate,
        "substitutions": substitutions,
        "shopping_list": shopping_list,
        "related_recipes": related_recipes,
    }

@app.post("/api/extract", response_model=RecipeResponse)
def extract_recipe(req: ExtractRequest, db: Session = Depends(get_db)):
    existing_recipe = db.query(Recipe).filter(Recipe.url == req.url).first()
    if existing_recipe:
        return existing_recipe

    try:
        text_content = scrape_recipe_page(req.url)
        structured_data = extract_recipe_data(text_content)
        cleaned = normalize_recipe_data(structured_data, req.url)

        new_recipe = Recipe(**cleaned)
        db.add(new_recipe)
        db.commit()
        db.refresh(new_recipe)
        print(f"Saved recipe to database: id={new_recipe.id}, title={new_recipe.title}")
        return new_recipe
    except Exception as e:
        db.rollback()
        print(f"Recipe extraction/save failed for {req.url}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recipes", response_model=list[RecipeResponse])
def get_recipes(db: Session = Depends(get_db)):
    recipes = db.query(Recipe).order_by(Recipe.created_at.desc()).all()
    print(f"Loaded {len(recipes)} recipes from database")
    return recipes

@app.get("/api/recipes/{recipe_id}", response_model=RecipeResponse)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
os.makedirs(frontend_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
