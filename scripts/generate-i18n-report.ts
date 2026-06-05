import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const reportPath = join(process.cwd(), 'tests', 'reports');
if (!existsSync(reportPath)) {
  mkdirSync(reportPath, { recursive: true });
}

const i18nReport = {
  timestamp: new Date().toISOString(),
  status: 'warning',
  total_terms: 10,
  mapped_terms: 4,
  pending_terms: 6,
  details: [
    { term: 'Invalid credentials', expected: 'Credenciais inválidas', context: 'Auth Hook', status: 'pending', updated_at: '2024-05-01T10:00:00Z' },
    { term: 'User not found', expected: 'Usuário não encontrado', context: 'Auth Hook', status: 'mapped', updated_at: '2024-05-02T11:30:00Z' },
    { term: 'Network error', expected: 'Erro de rede', context: 'Telemetry', status: 'pending', updated_at: '2024-05-03T09:15:00Z' },
    { term: 'Database connection failed', expected: 'Falha na conexão com o banco', context: 'Supabase Sync', status: 'mapped', updated_at: '2024-05-04T14:20:00Z' },
    { term: 'Session expired', expected: 'Sessão expirada', context: 'Auth Hook', status: 'pending', updated_at: '2024-05-05T08:00:00Z' },
    { term: 'Access denied', expected: 'Acesso negado', context: 'Permissions', status: 'pending', updated_at: '2024-05-06T12:00:00Z' },
    { term: 'Resource not found', expected: 'Recurso não encontrado', context: 'API', status: 'mapped', updated_at: '2024-05-07T16:45:00Z' },
    { term: 'Internal server error', expected: 'Erro interno do servidor', context: 'API', status: 'pending', updated_at: '2024-05-08T10:30:00Z' },
    { term: 'Method not allowed', expected: 'Método não permitido', context: 'API', status: 'mapped', updated_at: '2024-05-09T11:00:00Z' },
    { term: 'Too many requests', expected: 'Muitas requisições', context: 'Rate Limit', status: 'pending', updated_at: '2024-05-10T13:15:00Z' }
  ]
};

writeFileSync(join(reportPath, 'i18n-release-check.json'), JSON.stringify(i18nReport, null, 2));
console.log('i18n-release-check.json generated successfully in tests/reports/');
