import os
import re

def clean_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    import_count = 0
    new_lines = []
    has_alias_import = False
    
    # First pass: check if we have the @/components/ui/button import
    for line in lines:
        if re.search(r'import\s+.*Button.*from\s+[\'"]@\/components\/ui\/button[\'"]', line):
            has_alias_import = True
            break
            
    # Second pass: remove duplicates
    seen_button_import = False
    for line in lines:
        is_button_import = re.search(r'import\s+.*Button.*from\s+[\'"].*button[\'"]', line)
        if is_button_import:
            # If we already have the @ alias import, remove any other relative ones
            if has_alias_import:
                if '@' in line and not seen_button_import:
                    new_lines.append(line)
                    seen_button_import = True
                else:
                    # Skip relative or duplicate alias imports
                    continue
            else:
                # If no @ alias, keep the first one we see
                if not seen_button_import:
                    new_lines.append(line)
                    seen_button_import = True
                else:
                    continue
        else:
            new_lines.append(line)

    if len(new_lines) != len(lines):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Cleaned {file_path}")

files_to_clean = [
    "src/components/landing/LandingHeader.tsx",
    "src/components/cathedra/lectio/LectioConclusio.tsx",
    "src/components/cathedra/lectio/LectioStep.tsx",
    "src/components/cathedra/AquinasOpera.tsx",
    "src/components/cathedra/Catechism.tsx",
    "src/components/cathedra/AppHeader.tsx",
    "src/components/cathedra/ViaCrucis.tsx",
    "src/components/cathedra/Magisterium.tsx",
    "src/components/cathedra/MagisteriumViewer.tsx",
    "src/components/cathedra/SaintDetail.tsx",
    "src/components/cathedra/Rosary.tsx",
    "src/components/cathedra/Bible.tsx",
    "src/components/cathedra/Sidebar.tsx",
    "src/components/cathedra/PrayerPage.tsx"
]

for f in files_to_clean:
    if os.path.exists(f):
        clean_file(f)
