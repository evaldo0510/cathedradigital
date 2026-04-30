import * as fs from 'fs';
import * as path from 'path';

// Allow overriding data for testing via env var
const DATA_PATH = process.env.CATECHISM_DATA_PATH || '../src/data/catechism';
const { CATECHISM_LOCAL_DATA } = await import(DATA_PATH);

// Threshold and Config flags
const threshold = parseFloat(process.env.CATECHISM_VALIDATION_THRESHOLD || '0'); 
const failOnAI = process.env.CATECHISM_FAIL_ON_AI_FIELDS !== 'false';
const autoCleanAI = process.env.CATECHISM_AUTO_CLEAN_AI === 'true';
const isDryRun = process.env.CATECHISM_DRY_RUN === 'true';

let buildFailed = false;

console.log('🔍 Iniciando validação avançada do Catecismo local...');
if (isDryRun) {
  console.log('🧪 Modo DRY RUN ativado: nada será alterado e o build nunca falhará.');
} else if (autoCleanAI) {
  console.log('🧹 Modo Auto-Clean ativado: campos de IA serão removidos dos registros.');
}


const items = Object.values(CATECHISM_LOCAL_DATA);
const totalItems = items.length;

// Severity levels
const SEVERITY = {
  HIGH: 0,   // Blocker
  MEDIUM: 1,
  LOW: 2
};

const errorCategories: Record<string, { severity: number; count: number }> = {
  'Tipo inconsistente (tipo)': { severity: SEVERITY.HIGH, count: 0 },
  'Tipo inconsistente (type)': { severity: SEVERITY.HIGH, count: 0 },
  'Tags vazias ou ausentes':   { severity: SEVERITY.HIGH, count: 0 },
  'ID ausente':                { severity: SEVERITY.MEDIUM, count: 0 },
  'Parágrafo inválido/ausente': { severity: SEVERITY.MEDIUM, count: 0 },
  'Título ausente':            { severity: SEVERITY.LOW, count: 0 },
  'Conteúdo ausente':          { severity: SEVERITY.LOW, count: 0 },
  'Campos de IA detectados':   { severity: SEVERITY.HIGH, count: 0 }
};

const failingRecords: any[] = [];

items.forEach((item: any, index) => {
  const itemErrors: { category: string; message: string; severity: number }[] = [];
  
  const addError = (category: string, message: string) => {
    itemErrors.push({ category, message, severity: errorCategories[category].severity });
    errorCategories[category].count++;
  };

  if (!item.id) addError('ID ausente', 'ID não encontrado no registro');
  if (item.paragraph === undefined || typeof item.paragraph !== 'number') {
    addError('Parágrafo inválido/ausente', 'Campo paragraph inválido');
  }
  
  if (item.tipo !== 'catecismo') {
    addError('Tipo inconsistente (tipo)', `Esperado 'catecismo', recebido '${item.tipo}'`);
  }
  if (item.type !== 'catechism') {
    addError('Tipo inconsistente (type)', `Esperado 'catechism', recebido '${item.type}'`);
  }
  
  if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
    addError('Tags vazias ou ausentes', 'O registro não possui tags definidas');
  }

  if (!item.titulo || item.titulo.trim() === '') addError('Título ausente', 'Título está vazio');
  if (!item.conteudo || item.conteudo.trim() === '') addError('Conteúdo ausente', 'Conteúdo está vazio');

  const forbiddenFields = ['explicacao', 'interpretacaoProfunda', 'aplicacaoPratica', 'reflexaoFinal', 'exercicio'];
  forbiddenFields.forEach(field => {
    if (item[field]) {
      addError('Campos de IA detectados', `O campo '${field}' não deve existir (Regra: Catecismo sem IA)`);
      if (autoCleanAI && !isDryRun) {
        delete item[field];
      }
    }
  });

  if (itemErrors.length > 0) {
    // Sort errors by severity for this record
    itemErrors.sort((a, b) => a.severity - b.severity);
    
    failingRecords.push({
      index,
      id: item.id || 'N/A',
      paragraph: item.paragraph || 0,
      errors: itemErrors
    });
  }
});

// Sort failing records by:
// 1. Highest severity error (asc: 0 is HIGH)
// 2. Category name of the first error (for grouping records with same severity)
failingRecords.sort((a, b) => {
  if (a.errors[0].severity !== b.errors[0].severity) {
    return a.errors[0].severity - b.errors[0].severity;
  }
  return a.errors[0].category.localeCompare(b.errors[0].category);
});



const report = {
  timestamp: new Date().toISOString(),
  totalRecords: totalItems,
  summary: {} as any,
  failingRecords: failingRecords.map(r => ({
    id: r.id,
    paragraph: r.paragraph,
    errors: r.errors.map((e: any) => ({ 
      category: e.category, 
      message: e.message,
      severity: e.severity
    }))
  }))
};


console.log('\n📊 RESUMO DE INTEGRIDADE');
console.log('========================');

Object.entries(errorCategories)
  .sort(([, a], [, b]) => a.severity - b.severity)
  .forEach(([category, data]) => {
    const percentage = (data.count / totalItems) * 100;
    const isOverThreshold = percentage > threshold;
    const isAIError = category === 'Campos de IA detectados';
    
    if (data.count > 0) {
      if (isAIError) {
        if (failOnAI) buildFailed = true;
      } else if (isOverThreshold) {
        buildFailed = true;
      }
    }

    const icon = data.count === 0 ? '✅' : (isAIError ? (failOnAI ? '❌' : '⚠️') : (isOverThreshold ? '❌' : '⚠️'));
    console.log(`${icon} ${category.padEnd(28)}: ${data.count.toString().padStart(3)} (${percentage.toFixed(1).padStart(5)}%) ${((isAIError && failOnAI) || (isOverThreshold && !isAIError)) && data.count > 0 ? '[FALHA]' : ''}`);
    
    report.summary[category] = {
      count: data.count,
      percentage: percentage.toFixed(2),
      status: data.count === 0 ? 'pass' : (isAIError ? (failOnAI ? 'fail' : 'warning') : (isOverThreshold ? 'fail' : 'warning'))
    };
  });
console.log('========================');
console.log(`Configuração de Threshold: ${threshold}% de tolerância.`);

// Sort failing records output by the highest severity error they contain
failingRecords.sort((a, b) => a.errors[0].severity - b.errors[0].severity);

if (failingRecords.length > 0) {
  console.log('\n📋 DETALHES DAS FALHAS (Ordenado por Gravidade):\n');
  failingRecords.forEach((record) => {
    const highestSeverity = record.errors[0].severity;
    const severityLabel = highestSeverity === SEVERITY.HIGH ? 'CRÍTICO' : highestSeverity === SEVERITY.MEDIUM ? 'MÉDIO' : 'BAIXO';
    
    console.log(`[${severityLabel}] §${record.paragraph} (ID: ${record.id})`);
    record.errors.forEach((err: any) => {
      console.log(`  - ${err.category}: ${err.message}`);
    });
    console.log('');
  });
}

// Write JSON Report
const reportPath = path.join(process.cwd(), 'catechism-validation-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Relatório JSON gerado em: ${reportPath}`);

if (buildFailed) {
  console.error('\n❌ O build foi interrompido porque a porcentagem de erros ultrapassou o limite permitido.');
  process.exit(1);
}

console.log(`\n✅ Validação concluída. Build prosseguindo.`);
process.exit(0);
