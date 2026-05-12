import json

with open('paragraphs_0_197.json', 'r') as f:
    data = json.load(f)

# Split into batches of 25 to avoid hitting limits
batch_size = 25
for i in range(0, len(data), batch_size):
    batch = data[i:i+batch_size]
    values = []
    for item in batch:
        p = item['paragraph']
        content = item['content'].replace("'", "''")
        values.append(f"({p}, '{content}')")
    
    query = f"INSERT INTO public.catechism_official (paragraph, content) VALUES {', '.join(values)} ON CONFLICT (paragraph) DO UPDATE SET content = EXCLUDED.content;"
    print(f"--- BATCH {i//batch_size} ---")
    print(query)
    print("--- END ---")
