import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

def extract_recipe_data(text: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable not set")

    # Using gemini-2.5-flash for high compatibility across all API versions and regions
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0.0)

    prompt_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prompts', 'recipe_extraction_prompt.txt')
    with open(prompt_path, 'r', encoding='utf-8') as file:
        prompt_template = file.read()

    prompt = PromptTemplate(template=prompt_template, input_variables=["text"])
    
    chain = prompt | llm
    
    response = chain.invoke({"text": text})
    raw_output = response.content

    # Clean up output to ensure it's valid JSON (remove markdown ticks)
    clean_output = raw_output.strip()
    if clean_output.startswith("```json"):
        clean_output = clean_output[7:]
    elif clean_output.startswith("```"):
        clean_output = clean_output[3:]
        
    if clean_output.endswith("```"):
        clean_output = clean_output[:-3]
        
    clean_output = clean_output.strip()

    try:
        data = json.loads(clean_output)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse LLM response into JSON: {str(e)} \nRaw output: {clean_output}")
