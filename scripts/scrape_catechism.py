import requests
from bs4 import BeautifulSoup
import os
import json
import re

def scrape_vatican_paragraphs(url, start_p, end_p):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    if not response.ok:
        return []
    
    response.encoding = 'iso-8859-1'
    soup = BeautifulSoup(response.text, 'html.parser')
    
    results = []
    # Only look inside the main content area if possible, or just ignore the "Notas" part
    # Typically Vatican pages have a specific structure
    
    paragraphs = soup.find_all('p')
    
    current_p = None
    current_text = ""
    
    for p in paragraphs:
        text = p.get_text().strip()
        if not text: continue
        if text.lower() == "notas": break # Stop at notes section
        
        # Match paragraph numbers like "11." or "198." at the start of a paragraph
        match = re.match(r'^(\d+)\.\s*(.*)', text)
        if match:
            num = int(match.group(1))
            content = match.group(2)
            
            if start_p <= num <= end_p:
                if current_p is not None:
                    results.append({"paragraph": current_p, "content": current_text.strip()})
                current_p = num
                current_text = content
            elif num > end_p:
                # We might have reached a further section, but sometimes sections are not ordered
                # so we continue just in case, but usually we can stop if it's much larger
                if num > end_p + 100: break
                continue
        elif current_p is not None:
            # Append subsequent lines to current paragraph
            current_text += "\n\n" + text
            
    if current_p is not None:
        results.append({"paragraph": current_p, "content": current_text.strip()})
        
    return results

# Sections to scrape
sections = [
    ('https://www.vatican.va/archive/cathechism_po/index_new/prologo%201-25_po.html', 1, 25),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p1s1c1_26-49_po.html', 26, 49),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p1s1c2_50-141_po.html', 50, 141),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p1s1c3_142-184_po.html', 142, 184),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p1s2_185-197_po.html', 185, 197),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p2s1c1_1066-1090_po.html', 1066, 1090),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p3s1c1_1691-1715_po.html', 1691, 1715),
    ('https://www.vatican.va/archive/cathechism_po/index_new/p4s2c1_2759-2802_po.html', 2759, 2802),
]


all_p = []
for url, start, end in sections:
    print(f"Scraping {start}-{end}...", file=os.sys.stderr)
    all_p.extend(scrape_vatican_paragraphs(url, start, end))

# De-duplicate by paragraph number
unique_p = { p['paragraph']: p['content'] for p in all_p }
final_p = [ {"paragraph": k, "content": v} for k, v in sorted(unique_p.items()) ]

print(json.dumps(final_p))

