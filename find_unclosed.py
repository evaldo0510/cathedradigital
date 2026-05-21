with open('src/components/cathedra/Bible.tsx', 'r') as f:
    content = f.read()
stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Extra closing brace at index {i}")
        else:
            stack.pop()
if stack:
    print(f"Unclosed braces: {len(stack)}")
    for i in stack:
        line_num = content[:i].count('\n') + 1
        print(f"Unclosed opening brace at line {line_num}")
