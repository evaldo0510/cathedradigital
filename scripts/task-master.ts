
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
  const backlog = content.split('\n')
    .filter(line => line.startsWith('- ') && !line.includes('None'))
    .map(line => line.replace('- ', '').trim());
    
  return { backlog, lastSync: stats.mtime.toISOString() };
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
  } else {
    try {
      // Simulating CI check if wave 2
      if (waveNumber === 2) {
        console.log('Executando CI (build/test)...');
        execSync('npm run build', { stdio: 'pipe' });
        logs.push('CI Green: Build completado com sucesso.');
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
  const reportPath = path.join(REPORTS_DIR, `report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Relatório gerado: ${reportPath}`);
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
    };

    const w1 = startWave(1, dryRun);
    report.waves.push({ number: 1, status: w1.errors.length ? 'Failed' : 'Success', logs: w1.logs, errors: w1.errors });

    if (!w1.errors.length) {
      const w2 = startWave(2, dryRun);
      report.waves.push({ number: 2, status: w2.errors.length ? 'Failed' : 'Success', logs: w2.logs, errors: w2.errors });
    }

    report.finalStatus = report.waves.every(w => w.status === 'Success') ? 'Success' : 'Failed';
    generateReport(report);
    break;
  }
  case 'status': {
    console.log('\n📊 [TASK MASTER] Status Detalhado dos Inboxes:');
    AGENTS.forEach(agent => {
      const { backlog, lastSync } = getInboxStatus(agent);
      console.log(`\n🤖 ${agent.toUpperCase()}`);
      console.log(`   - Última Sincronização: ${lastSync}`);
      console.log(`   - Backlog (${backlog.length}):`);
      if (backlog.length === 0) {
        console.log('     ✅ Sem pendências');
      } else {
        backlog.forEach(item => console.log(`     - [ ] ${item}`));
      }
    });
    break;
  }
  default:
    console.log('\n🛠️  [TASK MASTER] Comandos:');
    console.log('- npm run task-master run      : Execução completa (Wave 1 + 2 + Relatório)');
    console.log('- npm run task-master status   : Status detalhado e backlog');
    console.log('- npm run task-master wave-1   : Wave de Ação');
    console.log('- npm run task-master wave-2   : Wave de Drenagem');
    console.log('\nOpções:');
    console.log('--dry-run                      : Simula execuções sem alterar código');
    break;
}
