import requests
from bs4 import BeautifulSoup
import json
import time

BASE_URL = "https://stardewvalleywiki.com"

# The exact list of villagers you provided
VILLAGERS = [
    "Alex", "Elliott", "Harvey", "Sam", "Sebastian", "Shane",
    "Abigail", "Emily", "Haley", "Leah", "Maru", "Penny",
    "Caroline", "Clint", "Demetrius", "Dwarf", "Evelyn",
    "George", "Gus", "Jas", "Jodi", "Kent", "Krobus", "Leo",
    "Lewis", "Linus", "Marnie", "Pam", "Pierre", "Robin",
    "Sandy", "Vincent", "Willy", "Wizard"
]

def scrape_villager_quotes():
    print("\n--- Starting Villager Quotes Scraping ---")
    
    all_villagers_data = []

    # Added enumerate here to get the villager's index
    for villager_index, villager in enumerate(VILLAGERS):
        print(f"Scraping quotes for {villager}...")
        url = f"{BASE_URL}/{villager}"
        
        try:
            response = requests.get(url)
            
            if response.status_code != 200:
                print(f"  -> Failed to retrieve page for {villager} (Status: {response.status_code})")
                continue
                
            soup = BeautifulSoup(response.text, 'html.parser')
            quote_cells = soup.find_all('td', class_='squotetext')
            
            villager_quotes = []
            
            for quote_index, cell in enumerate(quote_cells):
                quote_text = cell.get_text(separator=' ', strip=True)
                quote_text = " ".join(quote_text.split())
                
                if quote_text:
                    villager_quotes.append({
                        "index": quote_index,
                        "quote": quote_text
                    })
            
            # Now saving the villager's index alongside their name
            all_villagers_data.append({
                "index": villager_index,
                "name": villager,
                "quotes": villager_quotes
            })
            
            print(f"  -> Found {len(villager_quotes)} quotes.")
            
        except requests.RequestException as e:
            print(f"  -> Request failed for {villager}: {e}")
            
        time.sleep(0.5)

    output_filename = 'quotes.json'
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(all_villagers_data, f, indent=4, ensure_ascii=False)
        
    print(f"\nSuccess! Scraped quotes for {len(all_villagers_data)} villagers into '{output_filename}'.")

if __name__ == "__main__":
    scrape_villager_quotes()