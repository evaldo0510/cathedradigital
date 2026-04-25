
import { describe, it, expect, vi } from 'vitest';

// Simulating the Audit Pagination logic
const fetchAuditLogsLogic = async (
  isAdmin: boolean,
  currentPage: number,
  adminFilter: string,
  start: string,
  end: string,
  mockSupabase: any
) => {
  if (!isAdmin) return { data: [], hasMore: false };

  let query = mockSupabase.from('app_metrics')
    .select('*')
    .eq('metric_type', 'csv_export')
    .order('created_at', { ascending: false });

  if (adminFilter) {
    query = query.filter('metadata->>user_email', 'ilike', `%${adminFilter}%`);
  }
  if (start) query = query.gte('created_at', start);
  if (end) query = query.lte('created_at', end);

  const { data, error } = await query.range(currentPage * 20, (currentPage + 1) * 20 - 1);
  
  if (error) throw error;
  
  return {
    data: data || [],
    hasMore: data && data.length === 20,
    nextPage: currentPage + 1
  };
};

describe('Audit History Pagination & Filtering Logic', () => {
  const mockLogs = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    metadata: { user_email: i < 10 ? 'admin@test.com' : 'other@test.com' },
    created_at: '2024-01-01T00:00:00Z'
  }));

  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            filter: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  range: vi.fn((start, end) => {
                    return Promise.resolve({ data: mockLogs.slice(start, end + 1), error: null });
                  })
                }))
              }))
            })),
            range: vi.fn((start, end) => {
              return Promise.resolve({ data: mockLogs.slice(start, end + 1), error: null });
            })
          }))
        }))
      }))
    })) as any
  };

  it('should return 20 items for the first page', async () => {
    const result = await fetchAuditLogsLogic(true, 0, '', '', '', mockSupabase);
    expect(result.data.length).toBe(20);
    expect(result.hasMore).toBe(true);
  });

  it('should return remaining items for the second page', async () => {
    const result = await fetchAuditLogsLogic(true, 1, '', '', '', mockSupabase);
    expect(result.data.length).toBe(5);
    expect(result.hasMore).toBe(false);
  });

  it('should filter by admin email', async () => {
    // In a real test, we'd mock the filter response properly
    // This is just verifying the logic calls the right methods
    const filterSpy = vi.fn().mockReturnValue({ range: vi.fn().mockResolvedValue({ data: [], error: null }) });
    const localMock = {
        from: () => ({ select: () => ({ eq: () => ({ order: () => ({ filter: filterSpy }) }) }) })
    };
    await fetchAuditLogsLogic(true, 0, 'admin@test.com', '', '', localMock);
    expect(filterSpy).toHaveBeenCalledWith('metadata->>user_email', 'ilike', '%admin@test.com%');
  });

  it('should block non-admins from fetching logs', async () => {
    const result = await fetchAuditLogsLogic(false, 0, '', '', '', mockSupabase);
    expect(result.data.length).toBe(0);
  });
});
