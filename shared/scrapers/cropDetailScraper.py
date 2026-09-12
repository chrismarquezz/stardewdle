import json
import requests
from bs4 import BeautifulSoup
import time

def scrape_stardew_valley_crop_info(json_file_path="crops.json"):
    """
    Scrapes 'infodetail' from Stardew Valley Wiki crop pages and updates a JSON file.

    Args:
        json_file_path (str): The path to the crops.json file.
    """
    base_url = "https://stardewvalleywiki.com/"

    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            crops_data = json.load(f)
        print(f"Successfully loaded data from {json_file_path}")
    except FileNotFoundError:
        print(f"Error: {json_file_path} not found. Please ensure it exists with crop names.")
        print("Example crops.json content: [{'name': 'Strawberry', 'infodetail': ''}]")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from {json_file_path}. Please check its format.")
        return

    updated_crops_count = 0
    total_crops = len(crops_data)

    for index, crop in enumerate(crops_data):
        crop_name = crop.get("name")
        if not crop_name:
            print(f"Skipping entry {index}: 'name' key missing.")
            continue

        page_url = f"{base_url}{crop_name.replace(' ', '_').title()}"

        #print(f"[{index + 1}/{total_crops}] Scraping: {crop_name} from {page_url}")

        try:
            response = requests.get(page_url, timeout=10)
            response.raise_for_status() 

            soup = BeautifulSoup(response.text, 'html.parser')

            infobox_detail_element = soup.find('td', id='infoboxdetail')

            if infobox_detail_element:
                infodetail_text = infobox_detail_element.get_text(strip=True)
                crop['infodetail'] = infodetail_text
                #print(f"  - Found infodetail: '{infodetail_text[:50]}...'")
                updated_crops_count += 1
            else:
                crop['infodetail'] = "N/A"
                print(f"  - Infodetail not found for {crop_name}.")

        except requests.exceptions.RequestException as e:
            crop['infodetail'] = f"Error: {e}"
            print(f"  - Request failed for {crop_name}: {e}")
        except Exception as e:
            crop['infodetail'] = f"Error: {e}"
            print(f"  - An unexpected error occurred for {crop_name}: {e}")

        time.sleep(0.5)

    try:
        with open(json_file_path, 'w', encoding='utf-8') as f:
            json.dump(crops_data, f, indent=4, ensure_ascii=False)
        print(f"\nSuccessfully updated {updated_crops_count} out of {total_crops} crops.")
        print(f"Updated data saved to {json_file_path}")
    except Exception as e:
        print(f"Error saving updated data to {json_file_path}: {e}")

if __name__ == "__main__":
    scrape_stardew_valley_crop_info("shared/crops.json")
