from sqlalchemy import Column, Integer, String, JSON, DateTime
from backend.database import Base
import datetime

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    cuisine = Column(String)
    prep_time = Column(String)
    cook_time = Column(String)
    total_time = Column(String)
    servings = Column(Integer)
    difficulty = Column(String)
    
    ingredients = Column(JSON)
    instructions = Column(JSON)
    nutrition_estimate = Column(JSON)
    substitutions = Column(JSON)
    shopping_list = Column(JSON)
    related_recipes = Column(JSON)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
