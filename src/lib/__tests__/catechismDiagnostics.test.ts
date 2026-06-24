import { describe, it, expect } from 'vitest';
import {
  classifyCatechismError,
} from '@/lib/catechismDiagnostics';

describe('classifyCatechismError', () => {
  it('reconhece 401 / JWT como unauthorized', () => {
    expect(classifyCatechismError({ status: 401, message: 'jwt expired' }).code).toBe('unauthorized');
    expect(classifyCatechismError({ message: 'Unauthorized' }).code).toBe('unauthorized');
  });

  it('reconhece 403 / permission denied / RLS como forbidden', () => {
    expect(classifyCatechismError({ status: 403, message: 'Forbidden' }).code).toBe('forbidden');
    expect(classifyCatechismError({ message: 'permission denied for table' }).code).toBe('forbidden');
    expect(classifyCatechismError({ message: 'row-level security' }).code).toBe('forbidden');
  });

  it('reconhece not_found em diferentes formas', () => {
    expect(classifyCatechismError({ status: 404 }).code).toBe('not_found');
    expect(classifyCatechismError({ message: 'não encontrado' }).code).toBe('not_found');
    expect(classifyCatechismError({ message: 'not_found' }).code).toBe('not_found');
  });

  it('reconhece falha de rede', () => {
    expect(classifyCatechismError({ message: 'Failed to fetch' }).code).toBe('network');
  });

  it('faz fallback para unknown', () => {
    expect(classifyCatechismError({ message: 'Something else' }).code).toBe('unknown');
  });
});
