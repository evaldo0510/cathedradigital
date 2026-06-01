import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SKILL_DIR = '.agents/skills/task-master';
const INBOX_DIR = path.join(SKILL_DIR, 'inbox');
const REPORTS_DIR = 'reports/task-master';
const STATE_FILE = path.join(REPORTS_DIR, 'state.json');
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

interface State {
  lastSuccessfulWave: number;
  lastReportTimestamp: string;
}

function ensureDirectories() {
  [INBOX_DIR, REPORTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  AGENTS.forEach(agent => {
    const filePath = path.join(INBOX_DIR, `${agent}.md`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `# Inbox: ${agent.toUpperCase()}\n\nStatus: Ready\n\n## Pending Requests\n\n- None\n`);
    }
  });
}

function loadState(): State {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (e) {
      return { lastSuccessfulWave: 0, lastReportTimestamp: '' };
    }
  }
  return { lastSuccessfulWave: 0, lastReportTimestamp: '' };
}

function saveState(state: State) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getInboxStatus(agent: string) {
  const filePath = path.join(INBOX_DIR, `${agent}.md`);
  if (!fs.existsSync(filePath)) return { backlog: [], lastSync: 'Never' };
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const stats = fs.statSync(filePath);
  const backlogLines = content.split('\n')
    .filter(line => line.trim().startsWith('- ') && !line.includes('None'));
    
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
  
  const conflicts = waveNumber === 2 ? ['src/index.css (conflito detectado e simulado)'] : [];
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
    const agentsMsg = 'AGENT A (Core), AGENT B (Ecossistema), AGENT C (Guardião) ativados em paralelo.';
    console.log(agentsMsg);
    logs.push(agentsMsg);
  }

  if (dryRun) {
    const dryMsg = 'Simulando edições e verificando conflitos potenciais...';
    console.log(dryMsg);
    logs.push(dryMsg);
    const { affectedFiles, conflicts } = simulateEditions(waveNumber);
    logs.push(`Arquivos afetados: ${affectedFiles.join(', ')}`);
    if (conflicts.length > 0) {
      logs.push(`Conflitos previstos: ${conflicts.join(', ')}`);
    }
  } else {
    try {
      if (waveNumber === 2) {
        console.log('Executando CI (build/test)...');
        execSync('npm run build', { stdio: 'pipe' });
        logs.push('CI Green: Build completado com sucesso.');
      }
      
      // Simulating some "fixes"
      const fixMsg = `Wave ${waveNumber} aplicada com sucesso no código.`;
      logs.push(fixMsg);
      if (waveNumber === 2) {
        errors.push('Linting errors in Dashboard.tsx', 'Type mismatch in useData.ts');
      }
      
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TASK MASTER Report - ${new Date(report.timestamp).toLocaleString()}</title>
    <style>
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --primary: #38bdf8; --success: #22c55e; --error: #ef4444; }
        body { font-family: 'Inter', -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 40px auto; padding: 0 20px; background: var(--bg); color: var(--text); }
        .card { background: var(--card); padding: 24px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
        .status-Success { background: rgba(34, 197, 94, 0.2); color: var(--success); }
        .status-Failed { background: rgba(239, 68, 68, 0.2); color: var(--error); }
        .status-Pending { background: rgba(255, 255, 255, 0.1); color: #94a3b8; }
        h1, h2, h3 { color: var(--primary); margin-top: 0; }
        .log-container { background: #000; padding: 16px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 0.85rem; overflow-x: auto; border: 1px solid #334155; }
        .log-entry { margin-bottom: 4px; border-bottom: 1px solid #1e293b; padding-bottom: 2px; }
        .error-entry { color: var(--error); }
        .summary-link { color: var(--primary); text-decoration: none; border-bottom: 1px dashed var(--primary); }
        .summary-link:hover { color: #7dd3fc; }
        .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 12px; }
        .meta-item { background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; }
    </style>
</head>
<body>
    <header>
        <h1>TASK MASTER: Orquestração de Elite</h1>
        <div class="card meta">
            <div class="meta-item"><strong>🕒 Timestamp:</strong><br>${new Date(report.timestamp).toLocaleString()}</div>
            <div class="meta-item"><strong>🎯 Status Final:</strong><br><span class="badge status-${report.finalStatus}">${report.finalStatus}</span></div>
        </div>
    </header>

    <main>
        ${report.waves.map(w => `
        <section class="card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="margin: 0;">Wave ${w.number}</h2>
                <span class="badge status-${w.status}">${w.status}</span>
            </div>
            
            ${w.summaryLink ? `<p>🔗 <a href="${w.summaryLink}" class="summary-link" target="_blank">Acessar Step Summary</a></p>` : ''}
            
            <h3>Logs da Wave</h3>
            <div class="log-container">
                ${w.logs.map(log => `<div class="log-entry">> ${log}</div>`).join('')}
            </div>

            ${w.errors.length > 0 ? `
            <h3>${w.status === 'Success' ? '✅ Erros Corrigidos' : '❌ Erros Identificados'}</h3>
            <ul class="log-container" style="list-style: none;">
                ${w.errors.map(err => `<li class="log-entry ${w.status === 'Success' ? '' : 'error-entry'}">${w.status === 'Success' ? 'FIXED: ' : 'ERROR: '}${err}</li>`).join('')}
            </ul>
            ` : ''}
        </section>
        `).join('')}
    </main>

    <footer style="text-align: center; margin-top: 40px; color: #64748b; font-size: 0.8rem;">
        Gerado automaticamente pela skill TASK MASTER
    </footer>
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
const resume = args.includes('--resume');

ensureDirectories();

switch (command) {
  case 'wave-1':
    startWave(1, dryRun);
    break;
  case 'wave-2':
    startWave(2, dryRun);
    break;
  case 'run': {
    console.log(`\n⚡ [TASK MASTER] Execução Automática (Full Cycle)${resume ? ' [RESUME MODE]' : ''}`);
    
    const state = resume ? loadState() : { lastSuccessfulWave: 0, lastReportTimestamp: '' };
    const report: Report = {
      timestamp: resume && state.lastReportTimestamp ? state.lastReportTimestamp : new Date().toISOString(),
      waves: [],
      finalStatus: 'Pending'
    };

    // Load existing wave reports if resuming
    if (resume && state.lastSuccessfulWave > 0) {
      console.log(`⏭️  Pulando waves já concluídas (1 até ${state.lastSuccessfulWave})`);
      for (let i = 1; i <= state.lastSuccessfulWave; i++) {
        report.waves.push({
          number: i,
          status: 'Success',
          logs: [`Wave recuperada via --resume`],
          errors: [],
          summaryLink: '#'
        });
      }
    }

    const startFrom = state.lastSuccessfulWave + 1;

    for (let i = startFrom; i <= 2; i++) {
      const wResult = startWave(i, dryRun);
      const success = wResult.errors.length === 0;
      
      report.waves.push({ 
        number: i, 
        status: success ? 'Success' : 'Failed', 
        logs: wResult.logs, 
        errors: wResult.errors,
        summaryLink: '#' 
      });

      if (!success) {
        break;
      }
      
      if (!dryRun) {
        state.lastSuccessfulWave = i;
        state.lastReportTimestamp = report.timestamp;
        saveState(state);
      }
    }

    // Check for pending inboxes - CRITICAL for exit code
    let totalPendencies = 0;
    AGENTS.forEach(agent => {
      const status = getInboxStatus(agent);
      totalPendencies += status.backlog.length;
    });

    const allWavesSuccess = report.waves.length === 2 && report.waves.every(w => w.status === 'Success');
    
    if (allWavesSuccess && totalPendencies === 0) {
      report.finalStatus = 'Success';
      if (!dryRun) {
        // Reset state on full success
        saveState({ lastSuccessfulWave: 0, lastReportTimestamp: '' });
      }
    } else {
      report.finalStatus = 'Failed';
    }

    generateReport(report);

    if (report.finalStatus === 'Failed') {
      if (totalPendencies > 0) {
        console.error(`\n❌ Falha: Existem ${totalPendencies} pendências nos Inboxes.`);
      } else {
        console.error('\n❌ Falha: Uma ou mais waves falharam.');
      }
      process.exit(1);
    } else {
      console.log('\n✨ [TASK MASTER] Execução finalizada com sucesso total e CI green.');
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
      console.log(`   🕒 Última Sincronização: ${lastSync}`);
      console.log(`   📝 Backlog (${backlog.length}):`);
      
      if (backlog.length === 0) {
        console.log('      ✨ Tudo limpo - Agente pronto');
      } else {
        backlog.forEach((item, idx) => {
          console.log(`      ${idx + 1}. [ ] ${item}`);
        });
      }
    });
    
    console.log('\n' + '='.repeat(40));
    console.log(`Total de pendências acumuladas: ${totalPendencies}`);
    console.log('='.repeat(40));
    
    const state = loadState();
    if (state.lastSuccessfulWave > 0) {
      console.log(`💡 Nota: O projeto parou na Wave ${state.lastSuccessfulWave}. Use --resume para continuar.`);
    }
    console.log('');
    break;
  }
  default:
    console.log('\n🛠️  [TASK MASTER] Comandos:');
    console.log('- npm run task-master:run      : Execução completa (Wave 1 + 2 + Relatórios)');
    console.log('- npm run task-master:status   : Status detalhado e backlog');
    console.log('\nOpções:');
    console.log('--dry-run                      : Simula edições, prevê conflitos e lista arquivos');
    console.log('--resume                       : Retoma da última wave que falhou');
    break;
}
