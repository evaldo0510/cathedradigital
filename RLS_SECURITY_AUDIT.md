# Relatório de Auditoria de Segurança RLS (Supabase)

## Resumo Executivo
Todas as tabelas contendo dados sensíveis do usuário (perfis, histórico, dados psicológicos, transações) possuem Row Level Security (RLS) habilitado e políticas que restringem o acesso exclusivamente ao proprietário dos dados ou a administradores autorizados.

---

## Detalhamento por Tabela

### Dados Sensíveis do Usuário
| Tabela | RLS | Acesso Admin | Acesso Usuário |
| :--- | :--- | :--- | :--- |
| `user_sensitive_data` | ✅ Sim | Leitura Total | CRUD Próprio |
| `profiles` | ✅ Sim | Gestão Total | Ver/Atualizar Próprio* |
| `profiles_private` | ✅ Sim | N/A | Ver/Atualizar Próprio |
| `user_psychological_profiles`| ✅ Sim | N/A | CRUD Próprio |
| `user_emotions` | ✅ Sim | N/A | CRUD Próprio |
| `transactions` | ✅ Sim | Leitura Total | Ver Próprio |

*\*A atualização de perfis por usuários comuns é validada pela função `can_update_own_profile` que impede a alteração de campos críticos como `role` e `is_premium`.*

### Formação e Jornadas
| Tabela | RLS | Regra de Negócio |
| :--- | :--- | :--- |
| `journeys` | ✅ Sim | Visível para todos |
| `journey_steps` | ✅ Sim | Etapas Premium exigem `is_premium` ou `admin` |
| `journey_progress` | ✅ Sim | Acesso restrito ao proprietário e admins |

### Conteúdo Público
As tabelas de `tags`, `saints`, `spiritual_contents`, `glossary` e `themes` são protegidas por RLS, mas possuem políticas `SELECT` permitindo leitura pública ou por usuários autenticados para garantir o funcionamento do ecossistema.

---

## Verificação de Funções de Segurança
- `has_role(uid, role)`: Validada. Verifica associação na tabela `user_roles`.
- `is_admin()`: Validada. Atalho para `has_role(uid, 'admin')`.
- `can_update_own_profile()`: Validada. Impede escalada de privilégios.

## Conclusão de Segurança
**Status: SEGURO.** 
Nenhum vazamento de dados sensíveis foi detectado. As rotas administrativas estão protegidas tanto no frontend (`AdminGuard`) quanto no backend (RLS).
