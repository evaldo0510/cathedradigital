import { CATECHISM_LOCAL_DATA } from '../src/data/catechism';

console.log('🔍 Iniciando validação detalhada do Catecismo local...');

const items = Object.values(CATECHISM_LOCAL_DATA);
const totalItems = items.length;
const failingRecords: { id: string; paragraph: number; errors: string[] }[] = [];

// Error categories for summary
const errorStats: Record<string, number> = {
  'ID ausente': 0,
  'Parágrafo inválido/ausente': 0,
  'Tipo inconsistente (tipo)': 0,
  'Tipo inconsistente (type)': 0,
  'Tags vazias ou ausentes': 0,
  'Título ausente': 0,
  'Conteúdo ausente': 0
};

items.forEach((item: any) => {
  const itemErrors: string[] = [];
  
  if (!item.id) {
    itemErrors.push('ID ausente');
    errorStats['ID ausente']++;
  }
  if (item.paragraph === undefined || typeof item.paragraph !== 'number') {
    itemErrors.push('Parágrafo inválido ou ausente');
    errorStats['Parágrafo inválido/ausente']++;
  }
  
  if (item.tipo !== 'catecismo') {
    itemErrors.push(`tipo: esperado 'catecismo', recebido '${item.tipo}'`);
    errorStats['Tipo inconsistente (tipo)']++;
  }
  if (item.type !== 'catechism') {
    itemErrors.push(`type: esperado 'catechism', recebido '${item.type}'`);
    errorStats['Tipo inconsistente (type)']++;
  }
  
  if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
    itemErrors.push('Tags vazias ou ausentes');
    errorStats['Tags vazias ou ausentes']++;
  }

  if (!item.titulo || item.titulo.trim() === '') {
    itemErrors.push('Título ausente');
    errorStats['Título ausente']++;
  }
  if (!item.conteudo || item.conteudo.trim() === '') {
    itemErrors.push('Conteúdo ausente');
    errorStats['Conteúdo ausente']++;
  }

  if (itemErrors.length > 0) {
    failingRecords.push({
      id: item.id || 'N/A',
      paragraph: item.paragraph || 0,
      errors: itemErrors
    });
  }
});

const printSummary = () => {
  console.log('\n📊 RESUMO DE INTEGRIDADE');
  console.log('========================');
  Object.entries(errorStats).forEach(([category, count]) => {
    const percentage = ((count / totalItems) * 100).toFixed(1);
    const icon = count > 0 ? '❌' : '✅';
    console.log(`${icon} ${category.padEnd(28)}: ${count.toString().padStart(3)} (${percentage.padStart(5)}%)`);
  });
  console.log('========================\n');
};

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

  printSummary();
  console.error(`Total de erros: ${failingRecords.length} registro(s) com problema.`);
  process.exit(1);
}

printSummary();
console.log(`✅ Sucesso! ${items.length} registros validados corretamente.`);
process.exit(0);
