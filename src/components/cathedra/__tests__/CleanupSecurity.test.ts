
import { describe, it, expect, vi } from 'vitest';

// Types for the mocks
interface MockToast {
  error: (msg: string) => void;
  success: (msg: string) => void;
}

const mockToast: MockToast = {
  error: vi.fn() as any,
  success: vi.fn() as any,
};

const mockSupabase = {
  from: vi.fn(() => ({
    delete: vi.fn(() => ({
      gte: vi.fn(() => ({
        lte: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  })) as any,
};

// Simulation of the cleanup logic in TransactionsPage.tsx
const handleCleanupLogic = async (
  isAdmin: boolean,
  cleanupConfirmation: string,
  startDate: string,
  endDate: string,
  setLoading: (l: boolean) => void,
  setIsCleanupOpen: (o: boolean) => void,
  setCleanupConfirmation: (s: string) => void
) => {
  if (!isAdmin) {
    mockToast.error("Ação restrita a administradores.");
    return;
  }

  if (cleanupConfirmation !== 'CONFIRMAR') {
    mockToast.error("Digite 'CONFIRMAR' para autorizar.");
    return;
  }

  if (!startDate || !endDate) {
    mockToast.error('Selecione um período (início e fim) para a limpeza.');
    return;
  }

  setLoading(true);
  try {
    const { error } = await mockSupabase.from('transactions').delete()
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) throw error;
    mockToast.success('Registros removidos com sucesso.');
    setIsCleanupOpen(false);
    setCleanupConfirmation('');
  } catch (err: any) {
    mockToast.error('Erro: ' + err.message);
  } finally {
    setLoading(false);
  }
};

describe('Cleanup Security Logic', () => {
  const setLoading = vi.fn();
  const setIsCleanupOpen = vi.fn();
  const setCleanupConfirmation = vi.fn();

  it('should block non-admins', async () => {
    await handleCleanupLogic(false, 'CONFIRMAR', '2023-01-01', '2023-01-31', setLoading, setIsCleanupOpen, setCleanupConfirmation);
    expect(mockToast.error).toHaveBeenCalledWith("Ação restrita a administradores.");
    expect(setLoading).not.toHaveBeenCalled();
  });

  it('should require exactly "CONFIRMAR" string', async () => {
    await handleCleanupLogic(true, 'confirmar', '2023-01-01', '2023-01-31', setLoading, setIsCleanupOpen, setCleanupConfirmation);
    expect(mockToast.error).toHaveBeenCalledWith("Digite 'CONFIRMAR' para autorizar.");
    
    await handleCleanupLogic(true, 'YES', '2023-01-01', '2023-01-31', setLoading, setIsCleanupOpen, setCleanupConfirmation);
    expect(mockToast.error).toHaveBeenCalledWith("Digite 'CONFIRMAR' para autorizar.");
  });

  it('should require valid period', async () => {
    await handleCleanupLogic(true, 'CONFIRMAR', '', '', setLoading, setIsCleanupOpen, setCleanupConfirmation);
    expect(mockToast.error).toHaveBeenCalledWith('Selecione um período (início e fim) para a limpeza.');
  });

  it('should execute cleanup for admins with correct confirmation and dates', async () => {
    await handleCleanupLogic(true, 'CONFIRMAR', '2023-01-01', '2023-01-31', setLoading, setIsCleanupOpen, setCleanupConfirmation);
    expect(mockToast.success).toHaveBeenCalledWith('Registros removidos com sucesso.');
    expect(setIsCleanupOpen).toHaveBeenCalledWith(false);
    expect(setCleanupConfirmation).toHaveBeenCalledWith('');
  });
});
