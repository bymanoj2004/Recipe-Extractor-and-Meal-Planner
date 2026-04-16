import cloudscraper
from bs4 import BeautifulSoup
import re

def scrape_recipe_page(url: str) -> str:
    # Use cloudscraper to bypass anti-bot protections (like AllRecipes 403 Forbidden)
    scraper = cloudscraper.create_scraper(browser={
        'browser': 'chrome',
        'platform': 'windows',
        'mobile': False
    })
    response = scraper.get(url, timeout=15)
    response.raise_for_status()

    soup = BeautifulSoup(response.content, 'html.parser')

    # Remove script, style, nav, footer, header to minimize token usage and noise
    for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
        script.extract()

    # Get clean text
    text = soup.get_text(separator=' ')
    
    # Condense whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text
