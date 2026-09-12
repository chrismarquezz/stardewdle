import requests
from bs4 import BeautifulSoup
import re
import json
import time

HEADERS = {"User-Agent": "Mozilla/5.0"}
BASE_URL = "https://stardewvalleywiki.com/"

crop_names = [
    "Blue_Jazz", "Carrot", "Cauliflower", "Coffee_Bean", "Garlic", "Green_Bean",
    "Kale", "Parsnip", "Potato", "Rhubarb", "Strawberry", "Tulip", "Unmilled_Rice",
    "Blueberry", "Corn", "Hops", "Hot_Pepper", "Melon", "Poppy", "Radish",
    "Red_Cabbage", "Starfruit", "Summer_Spangle", "Summer_Squash", "Sunflower",
    "Tomato", "Wheat", "Amaranth", "Artichoke", "Beet", "Bok_Choy", "Broccoli",
    "Cranberries", "Eggplant", "Fairy_Rose", "Grape", "Pumpkin", "Yam",
    "Powdermelon", "Ancient_Fruit", "Cactus_Fruit", "Fiber", "Mixed_Flower_Seeds",
    "Mixed_Seeds", "Pineapple", "Taro_Root", "Sweet_Gem_Berry", "Tea_Leaves", "Wild_Seeds"
]

def parse_crop_page(crop_name):
    url = BASE_URL + crop_name
    print(f"Fetching {crop_name}...")
    res = requests.get(url, headers=HEADERS)
    if res.status_code != 200:
        print(f"Failed to fetch {crop_name}: {res.status_code}")
        return None

    soup = BeautifulSoup(res.text, "html.parser")
    infobox = soup.find("table", id="infoboxtable")

    if not infobox:
        print(f"No infobox for {crop_name}")
        return None

    crop = {
        "name": crop_name.lower(),
        "growth_time": None,
        "season": [],
        "base_price": None,
        "regrows": False,
        "image_url": "",
        "type":"",
    }

    paragraphs = soup.find_all("p", limit=3)
    for p in paragraphs:
        for a in p.find_all("a"):
            title = a.get("title", "").lower()
            if "vegetable" in title:
                crop["type"] = "vegetable"
                break
            elif "fruit" in title:
                crop["type"] = "fruit"
                break
            elif "flower" in title:
                crop["type"] = "flower"
                break
        if crop.get("type"):
            break

    regrowth_match = re.search(r"regrowth:\s*(\d+)\s*days", soup.get_text().lower())
    if regrowth_match and int(regrowth_match.group(1)) > 0:
        crop["regrows"] = True

    rows = infobox.find_all("tr")

    infobox_img = infobox.find("img")
    if infobox_img and "src" in infobox_img.attrs:
        crop["image_url"] = "https://stardewvalleywiki.com" + infobox_img["src"]

    for row in rows:
        header = row.find("td", id="infoboxsection")
        value = row.find("td", id="infoboxdetail")
        if not header or not value:
            continue

        key = header.get_text(strip=True).lower()

        if "growth time" in key:
            match = re.search(r"(\d+)\s*days?", value.get_text(strip=True))
            if match:
                crop["growth_time"] = int(match.group(1))

        elif "season" in key:
            season_links = value.find_all("a")
            crop["season"] = [a.get_text(strip=True).lower() for a in season_links if a.get_text(strip=True)]

    price_tables = soup.find_all("table", class_="no-wrap")
    for table in price_tables:
        tds = table.find_all("td")
        for td in tds:
            text = td.get_text(strip=True).lower()
            match = re.search(r"(\d+)\s*g", text)
            if match:
                crop["base_price"] = int(match.group(1))
                break
        if crop["base_price"] is not None:
            break

    if crop["growth_time"] and crop["base_price"]:
        return crop
    else:
        print(f"Missing data for {crop_name}: "
            f"growth_time={crop['growth_time']} base_price={crop['base_price']}")
    return None

if __name__ == "__main__":
    results = []
    for name in crop_names:
        crop = parse_crop_page(name)
        if crop:
            results.append(crop)
        time.sleep(0.5)

    with open("crops.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"Scraped {len(results)} crops and saved to crops.json")
