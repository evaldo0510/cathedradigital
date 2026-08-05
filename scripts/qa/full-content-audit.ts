import { supabase } from '../../src/integrations/supabase/client';

async function runAudit() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CATHEDRA DIGITAL 3.0 — AUDITORIA GLOBAL DE CONTEÚDO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const modules = [
    { name: 'Bíblia', table: 'bible_verses' },
    { name: 'Catecismo', table: 'catechism_paragraphs' },
    { name: 'Santos', table: 'saints' },
    { name: 'Orações', table: 'prayers' },
    { name: 'Aparições', table: 'marian_apparitions' },
    { name: 'Jornadas', table: 'journeys' },
    { name: 'Glossário', table: 'glossary_terms' },
    { name: 'Patrística', table: 'patristic_works' }
  ];

  const report = [];

  for (const mod of modules) {
    try {
      const { count, error } = await supabase
        .from(mod.table as any)
        .select('*', { count: 'exact', head: true });

      if (error) {
        report.push({ module: mod.name, status: 'Erro', detail: error.message });
      } else {
        report.push({ module: mod.name, status: 'Mapeado', count: count || 0 });
      }
    } catch (e) {
      report.push({ module: mod.name, status: 'Não encontrado', detail: 'Tabela ausente' });
    }
  }

  console.table(report);
  
  console.log('\nPróximos Passos:');
  console.log('1. Validar integração Reader V2 para Aparições.');
  console.log('2. Mapear arestas Nexus para conteúdos órfãos.');
  console.log('3. Gerar PRODUCT_HEALTH_REPORT.md.');
}

runAudit();
