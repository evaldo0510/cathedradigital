import requests
from bs4 import BeautifulSoup
import os
import json

def scrape_vatican_paragraphs(url, start_p, end_p):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    if not response.ok:
        print(f"Failed to fetch {url}")
        return []
    
    # Vatican pages are iso-8859-1
    response.encoding = 'iso-8859-1'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    results = []
    
    # The Vatican pages structure paragraphs with <b>N.</b>
    # Let's find all <p> tags
    paragraphs = soup.find_all('p')
    
    current_p = None
    current_text = ""
    
    for p in paragraphs:
        text = p.get_text().strip()
        if not text: continue
        
        # Check if it starts with a number followed by a dot
        # Example: "11. " or "11 "
        parts = text.split('.', 1)
        if len(parts) > 1 and parts[0].strip().isdigit():
            num = int(parts[0].strip())
            if start_p <= num <= end_p:
                if current_p is not None:
                    results.append({"paragraph": current_p, "content": current_text.strip()})
                current_p = num
                current_text = parts[1].strip()
            elif num > end_p:
                break
        elif current_p is not None:
            current_text += "\n\n" + text
            
    if current_p is not None:
        results.append({"paragraph": current_p, "content": current_text.strip()})
        
    return results

# Scrape 11-25
p11_25 = scrape_vatican_paragraphs('https://www.vatican.va/archive/cathechism_po/index_new/prologo%201-25_po.html', 11, 25)

# Scrape 31-49
p31_49 = scrape_vatican_paragraphs('https://www.vatican.va/archive/cathechism_po/index_new/p1s1c1_26-49_po.html', 31, 49)

all_p = p11_25 + p31_49

print(json.dumps(all_p))
