with open('src/components/cathedra/Bible.tsx', 'r') as f:
    content = f.read()
stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            # Found extra closing brace
            print(f"Extra closing brace at index {i}")
            # Find line number
            line_num = content[:i].count('\n') + 1
            print(f"Line number: {line_num}")
            print(f"Context: {content[i-50:i+50]}")
            break
        stack.pop()
