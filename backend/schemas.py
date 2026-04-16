from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union

class ExtractRequest(BaseModel):
    url: str

class Ingredient(BaseModel):
    quantity: str
    unit: str
    item: str

class NutritionEstimate(BaseModel):
    calories: Optional[Union[int, str]] = None
    protein: Optional[str] = None
    carbs: Optional[str] = None
    fat: Optional[str] = None

class RecipeBase(BaseModel):
    url: str
    title: str
    cuisine: str
    prep_time: str
    cook_time: str
    total_time: str
    servings: int
    difficulty: str
    
    ingredients: List[Ingredient] = []
    instructions: List[str] = []
    nutrition_estimate: Optional[NutritionEstimate] = None
    substitutions: List[str] = []
    shopping_list: Dict[str, List[str]] = {}
    related_recipes: List[str] = []

class RecipeResponse(RecipeBase):
    id: int
    created_at: Optional[Any] = None
    
    class Config:
        from_attributes = True
