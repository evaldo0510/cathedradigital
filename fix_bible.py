with open('src/components/cathedra/Bible.tsx', 'r') as f:
    content = f.read()
stack = []
to_remove = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Found extra closing brace at index {i}")
            to_remove.append(i)
        else:
            stack.pop()

# Also check parens
paren_stack = []
for i, char in enumerate(content):
    if char == '(':
        paren_stack.append(i)
    elif char == ')':
        if not paren_stack:
            print(f"Found extra closing paren at index {i}")
            to_remove.append(i)
        else:
            paren_stack.pop()

if not to_remove:
    print("No extra braces or parens found")
else:
    # Remove from end to start to not mess up indices
    new_content = list(content)
    for i in sorted(to_remove, reverse=True):
        new_content.pop(i)
    with open('src/components/cathedra/Bible.tsx', 'w') as f:
        f.write("".join(new_content))
    print(f"Removed {len(to_remove)} extra characters")
