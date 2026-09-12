import requests
from bs4 import BeautifulSoup
import json
import time
import os
from urllib.parse import urljoin

BASE_URL = "https://stardewvalleywiki.com"
FISH_DIR = "stardew_fish_icons"

def get_full_image_url(src):
    """Strips thumbnail parameters from the wiki URL to get the native image."""
    if "/thumb/" in src:
        src = src.replace("/thumb", "")
        src = src.rsplit("/", 1)[0]
    return urljoin(BASE_URL, src)

def download_image(img_url, name):
    """Downloads an image into the unified fish icons folder."""
    try:
        img_data = requests.get(img_url).content
        safe_name = name.replace(" ", "_").replace("'", "")
        file_name = f"{safe_name}.png"
        file_path = os.path.join(FISH_DIR, file_name)
        
        # Only download if we don't already have the file
        if not os.path.exists(file_path):
            with open(file_path, 'wb') as handler:
                handler.write(img_data)
                
    except Exception as e:
        print(f"  -> Failed to download image for {name}: {e}")

def scrape_fish():
    print("\n--- Starting Fish Scraping ---")
    os.makedirs(FISH_DIR, exist_ok=True)
    
    response = requests.get(f"{BASE_URL}/Fish")
    if response.status_code != 200:
        print("Failed to retrieve Fish page.")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # The explicit list of section IDs you requested
    target_sections = [
        "Fishing_Pole_Fish",
        "Night_Market_Fish", 
        "Legendary_Fish",
        "Legendary_Fish_II",
        "Crab_Pot_Fish",
        "Other_Catchables"
    ]
    
    fish_list = []
    fish_seen = set() # Keeps track of names to prevent duplicates in our index

    for section_id in target_sections:
        print(f"\nScanning section: {section_id.replace('_', ' ')}")
        
        # 1. Find the span header with the target ID
        heading = soup.find(id=section_id)
        
        if not heading:
            print(f"  -> Could not find heading for {section_id}")
            continue
            
        # 2. Find the very next wikitable that appears after this heading
        table = heading.find_next('table', class_='wikitable')
        if not table:
            print(f"  -> Could not find table for {section_id}")
            continue
            
        # 3. Iterate through the table rows
        rows = table.find('tbody').find_all('tr')
        
        for row in rows:
            cells = row.find_all('td')
            
            # Skip spacer or malformed rows
            if len(cells) < 2:
                continue
                
            # Name is in the second column
            name_a_tag = cells[1].find('a')
            if not name_a_tag:
                continue
                
            name = name_a_tag.text.strip()
            
            # If we've already scraped this fish, skip it to keep indexing accurate
            if name in fish_seen:
                continue
                
            print(f"Processing Fish: {name}...")
            
            # Image is in the first column
            img_tag = cells[0].find('img')
            if img_tag and img_tag.get('src'):
                img_url = get_full_image_url(img_tag.get('src'))
                download_image(img_url, name)
            
            # 4. Add to our lists
            fish_seen.add(name)
            fish_list.append({
                "name": name,
                "index": len(fish_list)
            })
            
    # Export to JSON
    output_filename = 'fish.json'
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(fish_list, f, indent=4, ensure_ascii=False)
        
    print(f"\nSuccess! Scraped {len(fish_list)} unique catchables into '{output_filename}'.")

if __name__ == "__main__":
    scrape_fish()