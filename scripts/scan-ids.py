import os
import re

def scan_files():
    id_pattern = re.compile(r'id=["\'](.*?)["\']')
    aria_labelledby_pattern = re.compile(r'aria-labelledby=["\'](.*?)["\']')
    aria_controls_pattern = re.compile(r'aria-controls=["\'](.*?)["\']')
    
    ids_found = {} # id -> list of files
    labelledby_refs = [] # (file, ref)
    controls_refs = [] # (file, ref)
    
    src_dir = 'src'
    
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Find IDs
                    for match in id_pattern.finditer(content):
                        node_id = match.group(1)
                        if '{' in node_id or '}' in node_id: continue # skip dynamic IDs for now
                        if node_id not in ids_found:
                            ids_found[node_id] = []
                        ids_found[node_id].append(path)
                    
                    # Find references
                    for match in aria_labelledby_pattern.finditer(content):
                        labelledby_refs.append((path, match.group(1)))
                    for match in aria_controls_pattern.finditer(content):
                        controls_refs.append((path, match.group(1)))
    
    duplicates = {k: v for k, v in ids_found.items() if len(v) > 1}
    
    # Simple check: are labelledby/controls referencing known static IDs?
    # (Note: many are dynamic, so this will have false positives, but good for static ones)
    broken_labelledby = [r for r in labelledby_refs if r[1] not in ids_found and '{' not in r[1]]
    broken_controls = [r for r in controls_refs if r[1] not in ids_found and '{' not in r[1]]
    
    with open('/mnt/documents/a11y-report.md', 'w', encoding='utf-8') as report:
        report.write("# A11y Static Audit Report\n\n")
        
        report.write("## 1. Duplicate IDs\n")
        if not duplicates:
            report.write("✅ No duplicate static IDs found.\n")
        else:
            for node_id, files in duplicates.items():
                report.write(f"- ID: `{node_id}`\n")
                for f in files:
                    report.write(f"  - `{f}`\n")
        
        report.write("\n## 2. Potential Broken ARIA References (Static)\n")
        report.write("*(Note: Dynamic IDs like `tab-${idx}` are excluded from this static scan)*\n\n")
        
        if not broken_labelledby and not broken_controls:
            report.write("✅ No broken static ARIA references found.\n")
        else:
            for f, ref in broken_labelledby:
                report.write(f"- Broken `aria-labelledby`: `{ref}` in `{f}`\n")
            for f, ref in broken_controls:
                report.write(f"- Broken `aria-controls`: `{ref}` in `{f}`\n")
                
    print("Report generated at /mnt/documents/a11y-report.md")

if __name__ == '__main__':
    scan_files()
