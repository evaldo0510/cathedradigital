
import re
import json

def parse_saints():
    try:
        with open('src/data/saints.ts', 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        return []

    # Simple regex to extract data from the SAINTS_DATA array
    # This is a bit fragile but should work for this specific file
    saint_blocks = re.findall(r'\{[^{}]*id:\s*\'[^\']*\'[^{}]*\}', content, re.DOTALL)
    
    # We also need the expanded ones
    try:
        with open('src/data/saints-expanded.ts', 'r', encoding='utf-8') as f:
            content_expanded = f.read()
            saint_blocks += re.findall(r'\{[^{}]*id:\s*\'[^\']*\'[^{}]*\}', content_expanded, re.DOTALL)
    except FileNotFoundError:
        pass
        
    return saint_blocks

def clean_value(v):
    v = v.strip().strip(',').strip('\'').strip('"')
    return v

def generate_sql(blocks):
    sql = "INSERT INTO public.saints (id, name, title, feast_day, feast_month, feast_day_num, born, died, patron_of, bio, full_bio, works, quotes, category, image, prayer, virtues, bible_refs, catechism_refs, church_doc_refs) VALUES \n"
    
    values = []
    for b in blocks:
        # Extract fields using simple regex
        def get_field(name):
            m = re.search(f'{name}:\s*[\'"]?([^\'",\n]*)[\'"]?,', b)
            if m: return m.group(1).replace("'", "''")
            return ""
        
        # Array fields
        def get_array(name):
            m = re.search(f'{name}:\s*\[([^\]]*)\]', b)
            if m:
                items = [i.strip().strip("'").replace("'", "''") for i in m.group(1).split(',') if i.strip()]
                return items
            return []

        id = get_field('id')
        name = get_field('name')
        if not id or not name: continue
        
        title = get_field('title')
        feast_day = get_field('feastDay')
        feast_month = get_field('feastMonth')
        feast_day_num = get_field('feastDayNum')
        born = get_field('born')
        died = get_field('died')
        bio = get_field('bio')
        full_bio = get_field('fullBio')
        category = get_field('category')
        image = get_field('image')
        prayer = get_field('prayer')
        
        patron_of = "ARRAY['" + "','".join(get_array('patronOf')) + "']::TEXT[]"
        quotes = "ARRAY['" + "','".join(get_array('quotes')) + "']::TEXT[]"
        virtues = "ARRAY['" + "','".join(get_array('virtues')) + "']::TEXT[]"
        
        # Simple JSON for works and refs
        works = "'[]'::JSONB"
        bible_refs = "'[]'::JSONB"
        catechism_refs = "'{}'::INTEGER[]"
        church_doc_refs = "'[]'::JSONB"

        values.append(f"('{id}', '{name}', '{title}', '{feast_day}', {feast_month or 0}, {feast_day_num or 0}, '{born}', '{died}', {patron_of}, '{bio}', '{full_bio}', {works}, {quotes}, '{category}', '{image}', '{prayer}', {virtues}, {bible_refs}, {catechism_refs}, {church_doc_refs})")

    sql += ",\n".join(values)
    sql += " ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, bio = EXCLUDED.bio, image = EXCLUDED.image;"
    return sql

blocks = parse_saints()
sql = generate_sql(blocks)
with open('import_saints.sql', 'w', encoding='utf-8') as f:
    f.write(sql)
print(f"Generated SQL for {len(blocks)} saints.")
