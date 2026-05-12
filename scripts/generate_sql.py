import json

filename = 'paragraphs_full_v1.json'
with open(filename, 'r') as f:
    data = json.load(f)

with open('insert_anchors.sql', 'w') as f:
    f.write("BEGIN;\n")
    for item in data:
        p = item['paragraph']
        content = item['content'].replace("'", "''")
        f.write(f"INSERT INTO public.catechism_official (paragraph, content) VALUES ({p}, '{content}') ON CONFLICT (paragraph) DO UPDATE SET content = EXCLUDED.content;\n")
    f.write("COMMIT;\n")

print(f"SQL file generated: insert_0_197.sql with {len(data)} statements.")
