
import re
import json

def parse_saints():
    with open('src/data/saints.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    with open('src/data/saints-expanded.ts', 'r', encoding='utf-8') as f:
        content += f.read()

    # Regex to extract blocks
    blocks = re.findall(r'\{[^{}]*id:\s*\'[^\']*\'[^{}]*\}', content, re.DOTALL)
    
    saints = []
    seen_ids = set()
    
    for b in blocks:
        def get_field(name):
            m = re.search(f'{name}:\s*[\'"]?([^\'",\n]*)[\'"]?,', b)
            return m.group(1).strip() if m else ""
        
        def get_array(name):
            m = re.search(f'{name}:\s*\[([^\]]*)\]', b)
            if m:
                return [i.strip().strip("'").strip('"') for i in m.group(1).split(',') if i.strip()]
            return []

        id = get_field('id')
        if not id or id in seen_ids: continue
        seen_ids.add(id)
        
        saints.append({
            "id": id,
            "name": get_field('name'),
            "title": get_field('title'),
            "feast_day": get_field('feastDay'),
            "feast_month": int(get_field('feastMonth') or 0),
            "feast_day_num": int(get_field('feastDayNum') or 0),
            "born": get_field('born'),
            "died": get_field('died'),
            "patron_of": get_array('patronOf'),
            "bio": get_field('bio'),
            "full_bio": get_field('fullBio'),
            "category": get_field('category'),
            "image": get_field('image'),
            "prayer": get_field('prayer'),
            "virtues": get_array('virtues'),
            "quotes": get_array('quotes')
        })
    return saints

saints = parse_saints()
with open('saints.json', 'w', encoding='utf-8') as f:
    json.dump(saints, f, ensure_ascii=False, indent=2)
print(f"Generated JSON for {len(saints)} saints.")
