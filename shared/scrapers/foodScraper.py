import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
from urllib.parse import urljoin

BASE_URL = "https://stardewvalleywiki.com"
FOOD_DIR = "foods"
ING_DIR = "ingredients"

def get_full_image_url(src):
    """
    The wiki often uses thumbnails in tables (e.g., /thumb/2/26/Egg.png/24px-Egg.png).
    This function strips the thumbnail parameters to grab the raw image URL.
    """
    if "/thumb/" in src:
        # Remove the /thumb part
        src = src.replace("/thumb", "")
        # Remove the scaling suffix at the end
        src = src.rsplit("/", 1)[0]
    return urljoin(BASE_URL, src)

def download_image(img_url, name, folder_name):
    """Downloads an image into the specified folder."""
    try:
        img_data = requests.get(img_url).content
        safe_name = name.replace(" ", "_").replace("'", "")
        file_name = f"{safe_name}.png"
        file_path = os.path.join(folder_name, file_name)
        
        # Only download if we don't already have the file
        if not os.path.exists(file_path):
            with open(file_path, 'wb') as handler:
                handler.write(img_data)
                
    except Exception as e:
        print(f"  -> Failed to download image for {name}: {e}")

def scrape_cooking():
    print("\n--- Starting Cooking Scraping ---")
    
    # 1. Setup Directories
    os.makedirs(FOOD_DIR, exist_ok=True)
    os.makedirs(ING_DIR, exist_ok=True)
    
    response = requests.get(f"{BASE_URL}/Cooking")
    if response.status_code != 200:
        print("Failed to retrieve Cooking page.")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # The main recipe table is the first wikitable on the page
    tables = soup.find_all('table', class_='wikitable')
    if not tables:
        print("Could not find the cooking table.")
        return
        
    recipe_table = tables[0]
    
    foods_data = []
    ingredients_list = []
    ingredients_seen = set() # To track uniqueness efficiently
    
    # Skip the header row by jumping into the table body
    rows = recipe_table.find('tbody').find_all('tr')
    
    for row in rows:
        cells = row.find_all('td')
        # Filter out spacer rows or malformed rows
        if len(cells) < 8:
            continue
            
        # --- PARSE FOOD ---
        food_a_tag = cells[1].find('a')
        if not food_a_tag:
            continue
            
        food_name = food_a_tag.text.strip()
        print(f"Processing Recipe: {food_name}...")
        
        # Download food image
        food_img_tag = cells[0].find('img')
        if food_img_tag and food_img_tag.get('src'):
            food_img_url = get_full_image_url(food_img_tag.get('src'))
            download_image(food_img_url, food_name, FOOD_DIR)
            
        # --- PARSE INGREDIENTS ---
        recipe_ingredients = {}
        
        # Look for the nametemplate spans inside the 4th column
        ingredient_spans = cells[3].find_all(['span'], class_=lambda c: c and 'nametemplate' in c)
        
        for span in ingredient_spans:
            ing_a_tag = span.find('a')
            if not ing_a_tag:
                continue
                
            ing_name = ing_a_tag.text.strip()
            
            # Use regex to extract the count inside the parentheses, e.g., (1) or (2)
            count_match = re.search(r'\((\d+)\)', span.text)
            ing_count = int(count_match.group(1)) if count_match else 1
            
            recipe_ingredients[ing_name] = ing_count
            
            # Check if this is a new ingredient we haven't processed yet
            if ing_name not in ingredients_seen:
                ingredients_seen.add(ing_name)
                
                # Append to our list, assigning it the next available index starting from 0
                ingredients_list.append({
                    "name": ing_name,
                    "index": len(ingredients_list)
                })
                
                # Download ingredient image
                ing_img_tag = span.find('img')
                if ing_img_tag and ing_img_tag.get('src'):
                    ing_img_url = get_full_image_url(ing_img_tag.get('src'))
                    download_image(ing_img_url, ing_name, ING_DIR)
        
        # --- COMPILE RECIPE DATA ---
        foods_data.append({
            "name": food_name,
            "index": len(foods_data),
            "ingredients": recipe_ingredients
        })

    # --- EXPORT TO JSON ---
    final_output = {
        "foods": foods_data,
        "ingredients": ingredients_list
    }
    
    output_filename = 'cooking.json'
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)
        
    print(f"\nSuccess! Scraped {len(foods_data)} foods and {len(ingredients_list)} unique ingredients into '{output_filename}'.")

if __name__ == "__main__":
    scrape_cooking()