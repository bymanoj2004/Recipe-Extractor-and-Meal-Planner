# Recipe Extractor & Meal Planner

A full-stack application built using FastAPI, PostgreSQL, LangChain + Gemini GenAI, and vanilla HTML/JS/CSS to extract structured recipe data from blog URLs and store them.

## Features

- **Tab 1: Extract Recipe** - Scrapes any recipe webpage using BeautifulSoup, cleans it, and uses a Google Gemini model via LangChain to extract ingredients, instructions, cooking times, generate nutritional estimates and suggested substitutions.
- **Tab 2: History** - Keeps a record of previously extracted recipes in a PostgreSQL database, viewable in a list format, with a modal option to open full details.
- **Modern UI** - Minimalistic and responsive interface using pure HTML, JavaScript, and CSS (with glassmorphism and modern colors).

## How It Works Under The Hood

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Server (FastAPI)
    participant Scraper (BS4)
    participant API (Gemini/Langchain)
    participant Database (Postgres)

    User->>Frontend: Clicks 'Extract Recipe'
    Frontend->>Server (FastAPI): POST /api/extract
    Server (FastAPI)->>Database (Postgres): Check if exists
    Server (FastAPI)->>Scraper (BS4): Fetch URL Content
    Scraper (BS4)-->>Server (FastAPI): Raw Text
    Server (FastAPI)->>API (Gemini/Langchain): Extract using Instruct Prompt
    API (Gemini/Langchain)-->>Server (FastAPI): Structured Recipe JSON
    Server (FastAPI)->>Database (Postgres): Insert new recipe
    Server (FastAPI)-->>Frontend: Recipe Data Payload
    Frontend-->>User: Beautiful UI Display
```

## Prerequisites
- Python 3.9+
- PostgreSQL server (can be installed locally via pgAdmin)
- Google Gemini API Key

## Setup Instructions

### 1. Database Configuration
1. Open pgAdmin.
2. Create a new database named `recipe_db`.
3. Locate the `.env.example` file in the root directory. Rename it to `.env`.
4. Update the `DATABASE_URL` line inside your `.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL=postgresql://your_user:your_password@localhost/recipe_db
   ```

### 2. API Key Configuration
Inside the same `.env` file, append your Google Gemini API Key:
```env
GEMINI_API_KEY=your_actual_key_here
```

### 3. Install Dependencies
Navigate to the project root and create a virtual environment (optional but recommended):
```bash
python -m venv venv
venv\Scripts\activate
```
Install the required packages:
```bash
pip install -r backend/requirements.txt
```

### 4. Running the Application
Start the FastAPI application. FastAPI handles the backend endpoints and serves the frontend static site synchronously.
```bash
python -m uvicorn backend.main:app --reload
```

Navigate to `http://127.0.0.1:8000/` in your browser.

## Project Structure
- `backend/`: FastAPI application code including SQLAlchemy models, schemas, LangChain LLM extractor, and BeautifulSoup scraper logic.
- `frontend/`: The frontend Vanilla HTML, CSS, JavaScript files.
- `prompts/`: Contains `recipe_extraction_prompt.txt` which templates the LangChain request.
- `sample_data/`: Contains `example_outputs.json` showcasing the data structure.

## Testing Steps
1. Once running, go to `http://127.0.0.1:8000/`.
2. Find any recipe online (e.g., `https://www.allrecipes.com/recipe/23891/grilled-cheese-sandwich/`).
3. Paste the URL into the input field under "Extract" and hit "Magic Extract ✨".
4. Review the extracted recipe structure matching the requirements grid.
5. Click on the "History" tab to see your historical recipes loaded directly from the PostgreSQL instance.
