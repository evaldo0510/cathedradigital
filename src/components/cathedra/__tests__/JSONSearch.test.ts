
import { describe, it, expect } from 'vitest';

// The logic implemented in TransactionsPage.tsx
const filterRecursive = (obj: any, term: string, counter: { count: number }): any => {
  if (typeof obj !== 'object' || obj === null) {
    if (String(obj).toLowerCase().includes(term.toLowerCase())) {
      counter.count++;
      return obj;
    }
    return undefined;
  }
  
  if (Array.isArray(obj)) {
    const filtered = obj.map(v => filterRecursive(v, term, counter)).filter(v => v !== undefined);
    return filtered.length > 0 ? filtered : undefined;
  }
  
  const result: any = {};
  let hasMatch = false;
  
  for (const key in obj) {
    if (key.toLowerCase().includes(term.toLowerCase())) {
      result[key] = obj[key];
      hasMatch = true;
      counter.count++;
      continue;
    }
    
    const val = filterRecursive(obj[key], term, counter);
    if (val !== undefined) {
      result[key] = val;
      hasMatch = true;
    }
  }
  
  return hasMatch ? result : undefined;
};

describe('JSON Recursive Filter', () => {
  const mockPayload = {
    id: "12345",
    status: "approved",
    payer: {
      email: "test@example.com",
      first_name: "John"
    },
    metadata: {
      plan: "cathedra_pro",
      items: [
        { name: "Subscription", price: 19.9 },
        { name: "Donation", price: 5.0 }
      ]
    }
  };

  it('should find top level matches', () => {
    const counter = { count: 0 };
    const result = filterRecursive(mockPayload, "approved", counter);
    expect(counter.count).toBe(1);
    expect(result.status).toBe("approved");
    expect(result.id).toBeUndefined();
  });

  it('should find nested matches and preserve path', () => {
    const counter = { count: 0 };
    const result = filterRecursive(mockPayload, "test@", counter);
    expect(counter.count).toBe(1);
    expect(result.payer.email).toBe("test@example.com");
    expect(result.payer.first_name).toBeUndefined();
  });

  it('should find matches in arrays', () => {
    const counter = { count: 0 };
    const result = filterRecursive(mockPayload, "Donation", counter);
    expect(counter.count).toBe(1);
    expect(result.metadata.items[0]).toEqual({ name: "Donation" });
  });

  it('should handle case insensitivity', () => {
    const counter = { count: 0 };
    const result = filterRecursive(mockPayload, "CATHEDRA", counter);
    expect(counter.count).toBe(1);
    expect(result.metadata.plan).toBe("cathedra_pro");
  });

  it('should return undefined if no match is found', () => {
    const counter = { count: 0 };
    const result = filterRecursive(mockPayload, "missing_term", counter);
    expect(result).toBeUndefined();
    expect(counter.count).toBe(0);
  });
});
