with open('src/components/cathedra/Bible.tsx', 'r') as f:
    content = f.read()
stack = []
for i, char in enumerate(content):
    if char == '{':
        stack.append(i)
    elif char == '}':
        if not stack:
            print(f"Extra closing brace at index {i}")
            # Show context
            start = max(0, i - 50)
            end = min(len(content), i + 50)
            print(f"Context: {content[start:end]}")
        else:
            stack.pop()
if stack:
    for s in stack:
        print(f"Unclosed opening brace at index {s}")
        start = max(0, s - 50)
        end = min(len(content), s + 50)
        print(f"Context: {content[start:end]}")
