import { CATECHISM_LOCAL_DATA } from '../src/data/catechism';

console.log('🔍 Iniciando validação detalhada do Catecismo local...');

const items = Object.values(CATECHISM_LOCAL_DATA);
const failingRecords: { id: string; paragraph: number; errors: string[] }[] = [];

items.forEach((item: any) => {
  const itemErrors: string[] = [];
  
  if (!item.id) itemErrors.push('ID ausente');
  if (item.paragraph === undefined || typeof item.paragraph !== 'number') itemErrors.push('Parágrafo inválido ou ausente');
  
  // Consistency checks
  if (item.tipo !== 'catecismo') itemErrors.push(`tipo: esperado 'catecismo', recebido '${item.tipo}'`);
  if (item.type !== 'catechism') itemErrors.push(`type: esperado 'catechism', recebido '${item.type}'`);
  
  if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
    itemErrors.push('Tags vazias ou ausentes');
  }

  if (!item.titulo || item.titulo.trim() === '') itemErrors.push('Título ausente');
  if (!item.conteudo || item.conteudo.trim() === '') itemErrors.push('Conteúdo ausente');

  if (itemErrors.length > 0) {
    failingRecords.push({
      id: item.id || 'N/A',
      paragraph: item.paragraph || 0,
      errors: itemErrors
    });
  }
});

if (failingRecords.length > 0) {
  console.error('\n❌ Validação falhou! Registros inválidos encontrados:\n');
  
  failingRecords.forEach((record, index) => {
    console.error(`Record #${index + 1}`);
    console.error(`  ID: ${record.id}`);
    console.error(`  Parágrafo: §${record.paragraph}`);
    console.error(`  Campos inválidos:`);
    record.errors.forEach(err => console.error(`    - ${err}`));
    console.error('-------------------------------------------');
  });

  console.error(`\nTotal de erros: ${failingRecords.length} registro(s) com problema.`);
  process.exit(1);
}

console.log(`✅ Sucesso! ${items.length} registros validados corretamente.`);
process.exit(0);
