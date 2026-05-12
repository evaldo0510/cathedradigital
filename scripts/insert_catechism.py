import json
import subprocess

with open('paragraphs_0_197.json', 'r') as f:
    data = json.load(f)

for item in data:
    p = item['paragraph']
    # Escape single quotes for SQL
    content = item['content'].replace("'", "''")
    query = f"INSERT INTO public.catechism_official (paragraph, content) VALUES ({p}, '{content}') ON CONFLICT (paragraph) DO UPDATE SET content = EXCLUDED.content;"
    
    # Execute via psql
    subprocess.run(['psql', '-c', query], capture_output=True)

print(f"Finished inserting {len(data)} paragraphs.")
