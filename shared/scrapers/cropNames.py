import requests
from bs4 import BeautifulSoup
import re

URL = "https://stardewvalleywiki.com/Crops"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def extract_crop_names_from_toc():
    res = requests.get(URL, headers=HEADERS)
    res.raise_for_status()
    soup = BeautifulSoup(res.text, "html.parser")

    toc = soup.find("div", id="toc")
    crop_links = toc.select("li.toclevel-2 > a")

    toc_raw = []

    for link in crop_links:
        name = link.get_text(strip=True)
        if name:
            name = name.replace(" ", "_").replace("_(Crop)", "").strip()
            toc_raw.append(name)

    crop_names = [entry.split('.', 1)[1][1:] for entry in toc_raw if not entry.startswith('1.')]

    return crop_names

if __name__ == "__main__":
    crops = extract_crop_names_from_toc()
    print(crops)
