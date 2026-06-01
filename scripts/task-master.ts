
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SKILL_DIR = '.agents/skills/task-master';
const INBOX_DIR = path.join(SKILL_DIR, 'inbox');
const REPORTS_DIR = 'reports/task-master';
const AGENTS = ['agent-a', 'agent-b', 'agent-c'];

interface Report {
  timestamp: string;
  waves: {
    number: number;
    status: string;
    logs: string[];
    errors: string[];
    summaryLink?: string;
  }[];
  finalStatus: string;
}

function ensureInboxes() {
  if (!fs.existsSync(INBOX_DIR)) {
    fs.mkdirSync(INBOX_DIR, { recursive: true });
  }

  AGENTS.forEach(agent => {
    const filePath = path.join(INBOX_DIR, `${agent}.md`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `# Inbox: ${agent.toUpperCase()}\n\nStatus: Ready\n\n## Pending Requests\n\n- None\n`);
    }
  });
}

function getInboxStatus(agent: string) {
  const filePath = path.join(INBOX_DIR, `${agent}.md`);
  if (!fs.existsSync(filePath)) return { backlog: [], lastSync: 'Never' };
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  const backlogLines = content.split('\n')
    .filter(line => line.startsWith('- ') && !line.includes('None'));
    
  const backlog = backlogLines.map(line => line.replace('- ', '').trim());
     
  return { 
    backlog, 
    lastSync: stats.mtime.toLocaleString('pt-BR'),
    rawLastSync: stats.mtime
  };
}

function simulateEditions(waveNumber: number) {
  const affectedFiles = waveNumber === 1 
    ? ['src/App.tsx', 'src/components/Dashboard.tsx', 'src/hooks/useData.ts']
    : ['src/index.css', 'src/main.tsx'];
  
  console.log('   📂 Arquivos afetados (simulação):');
  affectedFiles.forEach(f => console.log(`      - ${f}`));
  
  const conflicts = waveNumber === 2 ? ['src/index.css (resolvido automaticamente)'] : [];
  if (conflicts.length > 0) {
    console.log('   ⚠️  Conflitos previstos:');
    conflicts.forEach(c => console.log(`      - ${c}`));
  } else {
    console.log('   ✅ Nenhum conflito detectado.');
  }
  
  return { affectedFiles, conflicts };
}

function startWave(waveNumber: number, dryRun: boolean = false): { logs: string[], errors: string[] } {
  const logs: string[] = [];
  const errors: string[] = [];
  
  const prefix = dryRun ? '🔍 [DRY-RUN]' : '🚀';
  const msg = `${prefix} [TASK MASTER] Iniciando WAVE ${waveNumber}: ${waveNumber === 1 ? 'Ação' : 'Drenagem'}`;
  console.log(`\n${msg}`);
  logs.push(msg);

  if (waveNumber === 1) {
    const agentsMsg = 'AGENT A (Core), AGENT B (Ecossistema), AGENT C (Guardião) ativados.';
    console.log(agentsMsg);
    logs.push(agentsMsg);
  }

  if (dryRun) {
    const dryMsg = 'Simulando edições e verificando conflitos potenciais...';
    console.log(dryMsg);
    logs.push(dryMsg);
    const { affectedFiles } = simulateEditions(waveNumber);
    logs.push(`Arquivos afetados: ${affectedFiles.join(', ')}`);
  } else {
    try {
      if (waveNumber === 2) {
        console.log('Executando CI (build/test)...');
        execSync('npm run build', { stdio: 'pipe' });
        logs.push('CI Green: Build completado com sucesso.');
      }
      
      // Check for remaining inboxes at end of wave
      AGENTS.forEach(agent => {
        const status = getInboxStatus(agent);
        if (status.backlog.length > 0) {
          const warn = `Aviso: ${agent.toUpperCase()} ainda possui ${status.backlog.length} pendências.`;
          console.warn(`   ⚠️  ${warn}`);
          logs.push(warn);
        }
      });
    } catch (e: any) {
      const errMsg = `Erro no CI: ${e.message}`;
      console.error(errMsg);
      errors.push(errMsg);
    }
  }
  
  return { logs, errors };
}

function generateReport(report: Report) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  const baseFilename = `report-${Date.now()}`;
  
  // JSON
  const jsonPath = path.join(REPORTS_DIR, `${baseFilename}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  
  // HTML
  const htmlPath = path.join(REPORTS_DIR, `${baseFilename}.html`);
  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>TASK MASTER Report - ${report.timestamp}</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: 20px auto; padding: 0 20px; background: #f4f7f6; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .status-Success { color: #2ecc71; font-weight: bold; }
        .status-Failed { color: #e74c3c; font-weight: bold; }
        h1, h2 { color: #2c3e50; }
        ul { padding-left: 20px; }
        .log-entry { font-family: monospace; font-size: 0.9em; background: #eee; padding: 2px 5px; margin-bottom: 2px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>TASK MASTER: Relatório de Execução</h1>
    <div class="card">
        <p><strong>Timestamp:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        <p><strong>Status Final:</strong> <span class="status-${report.finalStatus}">${report.finalStatus}</span></p>
    </div>

    ${report.waves.map(w => `
    <div class="card">
        <h2>Wave ${w.number} - ${w.status}</h2>
        ${w.summaryLink ? `<p><a href="${w.summaryLink}" target="_blank">Ver Step Summary</a></p>` : ''}
        <h3>Logs:</h3>
        <div>${w.logs.map(log => `<div class="log-entry">${log}</div>`).join('')}</div>
        ${w.errors.length > 0 ? `<h3>Erros:</h3><ul>${w.errors.map(err => `<li>${err}</li>`).join('')}</ul>` : ''}
    </div>
    `).join('')}
</body>
</html>
  `;
  fs.writeFileSync(htmlPath, htmlContent);
  
  console.log(`\n📄 Relatório JSON: ${jsonPath}`);
  console.log(`📄 Relatório HTML: ${htmlPath}`);
}

const args = process.argv.slice(2);
const command = args[0];
const dryRun = args.includes('--dry-run');

ensureInboxes();

switch (command) {
  case 'wave-1':
    startWave(1, dryRun);
    break;
  case 'wave-2':
    startWave(2, dryRun);
    break;
  case 'run': {
    console.log('\n⚡ [TASK MASTER] Execução Automática (Full Cycle)');
    const report: Report = {
      timestamp: new Date().toISOString(),
      waves: [],
      finalStatus: 'Pending'
    }

    const w1 = startWave(1, dryRun);
    report.waves.push({ 
      number: 1, 
      status: w1.errors.length ? 'Failed' : 'Success', 
      logs: w1.logs, 
      errors: w1.errors,
      summaryLink: '#' // Simulando link do summary
    });

    if (!w1.errors.length) {
      const w2 = startWave(2, dryRun);
      report.waves.push({ 
        number: 2, 
        status: w2.errors.length ? 'Failed' : 'Success', 
        logs: w2.logs, 
        errors: w2.errors,
        summaryLink: '#'
      });
    }

    report.finalStatus = report.waves.every(w => w.status === 'Success') ? 'Success' : 'Failed';
    generateReport(report);

    if (report.finalStatus === 'Failed') {
      process.exit(1);
    }
    break;
  }
  case 'status': {
    console.log('\n📊 [TASK MASTER] Status Detalhado dos Inboxes:');
    let totalPendencies = 0;
    
    AGENTS.forEach(agent => {
      const { backlog, lastSync } = getInboxStatus(agent);
      totalPendencies += backlog.length;
      
      const statusIcon = backlog.length === 0 ? '🟢' : '🟡';
      console.log(`\n${statusIcon} ${agent.toUpperCase()}`);
      console.log(`   🕒 Sincronização: ${lastSync}`);
      console.log(`   📝 Backlog (${backlog.length}):`);
      
      if (backlog.length === 0) {
        console.log('      ✨ Tudo limpo');
      } else {
        backlog.forEach((item, idx) => {
          console.log(`      ${idx + 1}. [ ] ${item}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(40));
    console.log(`Total de pendências no projeto: ${totalPendencies}`);
    console.log('='.repeat(40) + '\n');
    break;
  }
  default:
    console.log('\n🛠️  [TASK MASTER] Comandos:');
    console.log('- npm run task-master run      : Execução completa (Wave 1 + 2 + Relatórios)');
    console.log('- npm run task-master status   : Status detalhado e backlog');
    console.log('- npm run task-master wave-1   : Wave de Ação');
    console.log('- npm run task-master wave-2   : Wave de Drenagem');
    console.log('\nOpções:');
    console.log('--dry-run                      : Simula execuções, prevê conflitos e lista arquivos');
    break;
}
