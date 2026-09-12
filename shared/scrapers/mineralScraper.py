import requests
from bs4 import BeautifulSoup
import json
import time
import os
from urllib.parse import urljoin

BASE_URL = "https://stardewvalleywiki.com"
IMG_DIR = "geology_icons"

def download_image(full_img_url, name):
    """Downloads an image into the unified icons folder."""
    try:
        img_data = requests.get(full_img_url).content
        safe_name = name.replace(" ", "_").replace("'", "")
        file_name = f"{safe_name}.png"
        file_path = os.path.join(IMG_DIR, file_name)
        
        with open(file_path, 'wb') as handler:
            handler.write(img_data)
            
    except Exception as e:
        print(f"  -> Failed to download image for {name}: {e}")

def scrape_minerals(items_list):
    print("\n--- Starting Minerals Scraping ---")
    response = requests.get(f"{BASE_URL}/Minerals")
    if response.status_code != 200:
        print("Failed to retrieve Minerals page.")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    mineral_table = soup.find('table', id='mineraltable')

    for link in mineral_table.find_all('a'):
        name = link.get('title') or link.text.strip()
        href = link.get('href')

        if not name or not href:
            continue

        mineral_url = urljoin(BASE_URL, href)
        print(f"Processing Mineral: {name}...")

        try:
            min_response = requests.get(mineral_url)
            min_soup = BeautifulSoup(min_response.text, 'html.parser')

            img_tag = min_soup.find('img', alt=lambda x: x and name in x and x.endswith('.png'))
            if not img_tag:
                a_image = min_soup.find('a', class_='image')
                if a_image:
                    img_tag = a_image.find('img')

            if img_tag and img_tag.get('src'):
                full_img_url = urljoin(BASE_URL, img_tag.get('src'))
                download_image(full_img_url, name)
            
            # Add to our unified list with its index
            items_list.append({
                "name": name,
                "index": len(items_list)
            })

        except requests.RequestException as e:
            print(f"  -> Request failed for {name}: {e}")

        time.sleep(0.5) 

def scrape_artifacts(items_list):
    print("\n--- Starting Artifacts Scraping ---")
    response = requests.get(f"{BASE_URL}/Artifacts")
    if response.status_code != 200:
        print("Failed to retrieve Artifacts page.")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    artifact_table = soup.find('table', class_='wikitable')

    rows = artifact_table.find('tbody').find_all('tr')
    
    for row in rows:
        cells = row.find_all('td')
        if len(cells) < 2:
            continue
            
        name_tag = cells[1].find('a')
        if not name_tag:
            continue
        name = name_tag.text.strip()
        
        img_tag = cells[0].find('img')
        
        if img_tag and img_tag.get('src'):
            print(f"Processing Artifact: {name}...")
            full_img_url = urljoin(BASE_URL, img_tag.get('src'))
            download_image(full_img_url, name)

        # Add to our unified list with its index
        items_list.append({
            "name": name,
            "index": len(items_list)
        })


if __name__ == "__main__":
    # 1. Create a single folder for all icons
    os.makedirs(IMG_DIR, exist_ok=True)
    
    # 2. Create one list to hold everything
    all_items = []

    # 3. Pass the list by reference so both functions append to it continuously 
    scrape_minerals(all_items)
    scrape_artifacts(all_items)

    # 4. Write the flat list to our JSON
    output_filename = 'geology.json'
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_items, f, indent=4, ensure_ascii=False)
        
    print(f"\nSuccessfully scraped {len(all_items)} items into '{output_filename}'!")