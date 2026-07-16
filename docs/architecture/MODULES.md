# MODULES.md — Módulos funcionais

Escopo: `CAT-001` a `CAT-015`. Mapeamento detalhado dos módulos que compõem a experiência do usuário.

## Estado atual

| Código  | Módulo         | Presente no repo | Caminhos principais                                                              |
| ------- | -------------- | :--------------: | -------------------------------------------------------------------------------- |
| CAT-001 | Bíblia         | ✅               | `src/components/cathedra/Bible*.tsx`, `src/hooks/bible/**`, `supabase/functions/bible-*/` |
| CAT-002 | Catecismo      | ✅               | `src/components/cathedra/Catechism*.tsx`, `supabase/functions/catechism-text/`   |
| CAT-003 | Magistério     | ✅               | `src/components/cathedra/MagisteriumViewer.tsx`, `supabase/functions/vatican-document/` |
| CAT-004 | Liturgia       | ✅               | `src/hooks/useLiturgicalMonth.ts`, `supabase/functions/liturgical-calendar/`     |
| CAT-005 | Lectio Divina  | ✅               | `src/components/cathedra/lectio/**`                                              |
| CAT-006 | Nexus          | ✅               | `supabase/functions/nexus-relations/`, `src/lib/nexusContent.ts`                 |
| CAT-007 | Formação       | ✅               | `src/pages/GuidedReading.tsx`, `AZFaithPage.tsx`, `AchievementsPage.tsx`         |
| CAT-008 | Estudos        | ✅               | `src/components/cathedra/BibliotecaPage.tsx`, `AquinasOpera.tsx`, `encyclopedia/**` |
| CAT-009 | Perfil         | ✅               | `src/hooks/useSpiritualProfile.ts`, `src/lib/psychologicalProfile.ts`            |
| CAT-010 | Administração  | ✅               | `src/pages/admin/**`, `src/components/admin/**`, `src/components/cathedra/Admin*.tsx` |
| CAT-011 | PCL            | ✅               | `supabase/functions/pcl-*/` (6 funções), `src/pages/BibleSprint1Admin.tsx`       |
| CAT-012 | Dashboard      | ✅               | `BiblePerfDashboard.tsx`, `AuditDashboard.tsx`, `CidComplianceDashboardPage.tsx`, `SecurityDashboard.tsx` |
| CAT-013 | Financeiro     | ✅ (parcial)     | `supabase/functions/mercado-pago-*`, `mercadopago-*`, `validate-coupon/`         |
| CAT-014 | Marketplace    | ❌               | Reservado, sem implementação                                                     |
| CAT-015 | IA             | ✅               | `supabase/functions/logos-ai/`, `logos-spiritual-insight/`, `colloquium/`        |

## Dependências entre módulos

- **CAT-001 Bíblia** é referenciado por CAT-002, CAT-003, CAT-005, CAT-006, CAT-007, CAT-011.
- **CAT-006 Nexus** conecta CAT-001 ↔ CAT-002 ↔ CAT-003 (cross-referências em popovers).
- **CAT-011 PCL** governa a ativação/expiração de fontes de tradução usadas por CAT-001.
- **CAT-012 Dashboard** agrega telemetria de todos os demais.
- **CAT-013 Financeiro** libera acesso PRO usado transversalmente.
- **CAT-015 IA** é acessado pontualmente por CAT-005 e CAT-007.

## Estado homologado

- Roadmap de sprints mantém CAT-001 como prioridade central (Bíblia Soberana).
- Codificação CAT-001…CAT-015 é canônica; novos módulos usam a próxima numeração livre.

## Dívida técnica

- **CAT-014 Marketplace** — só existe como código reservado.
- **CAT-013 Financeiro** — duplicação de webhook MP (ver [EDGE-FUNCTIONS.md](./EDGE-FUNCTIONS.md#duplicações)).
- **CAT-015 IA** — não há inventário público de prompts nem versionamento de modelos.

## Propostas pós-evento

- Documento `README.md` por módulo dentro do respectivo diretório (dependente da Proposta A do backlog).
- Diagrama de dependências entre módulos gerado automaticamente a partir de imports.
