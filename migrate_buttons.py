import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if it's a snapshot or not a tsx file
    if '__snapshots__' in file_path or not file_path.endswith('.tsx'):
        return

    # Check if file has <button or </button
    if '<button' not in content and '</button' not in content:
        return

    # Replace <button with <Button (case sensitive to avoid replacing existing Button)
    # Use regex to only replace <button followed by space, newline, or >
    new_content = re.sub(r'<button([\s\/>])', r'<Button\1', content)
    new_content = new_content.replace('</button>', '</Button>')

    # Check if Button is imported
    import_pattern = r'import\s+.*Button.*from\s+[\'"]@\/components\/ui\/button[\'"]'
    if not re.search(import_pattern, new_content):
        # Add import at the top
        # Find where to insert (after other imports or at top)
        import_line = "import { Button } from '@/components/ui/button';\n"
        new_content = import_line + new_content

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Processed {file_path}")

# Get all files in src
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
