
import fs from 'fs';
import path from 'path';

const INBOX_DIR = '.agents/skills/task-master/inbox';
const AGENTS = ['agent-a', 'agent-b', 'agent-c'];

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

function startWave(waveNumber: number) {
  console.log(`\n🚀 [TASK MASTER] Iniciando WAVE ${waveNumber}: ${waveNumber === 1 ? 'Ação' : 'Drenagem'}`);
  console.log('---------------------------------------------------------');
  
  if (waveNumber === 1) {
    console.log('AGENT A (Core): Iniciando desenvolvimento da lógica central.');
    console.log('AGENT B (Ecossistema): Preparando hooks e suítes de teste.');
    console.log('AGENT C (Guardião): Auditando design system e segurança.');
  } else {
    console.log('Processando Inboxes e realizando revisão cruzada...');
  }
  
  console.log('---------------------------------------------------------');
  console.log(`WAVE ${waveNumber} em progresso. Aguardando conclusão dos agentes...\n`);
}

const args = process.argv.slice(2);
const command = args[0];

ensureInboxes();

switch (command) {
  case 'wave-1':
    startWave(1);
    break;
  case 'wave-2':
    startWave(2);
    break;
  case 'status':
    console.log('\n📊 [TASK MASTER] Status Atual:');
    AGENTS.forEach(agent => {
      const filePath = path.join(INBOX_DIR, `${agent}.md`);
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasRequests = content.includes('- None') ? 'Nenhuma pendência' : 'Pendências detectadas!';
      console.log(`- ${agent.toUpperCase()}: ${hasRequests}`);
    });
    break;
  default:
    console.log('\n🛠️  [TASK MASTER] Comandos Disponíveis:');
    console.log('- npm run task-master wave-1  : Inicia a Wave de Ação');
    console.log('- npm run task-master wave-2  : Inicia a Wave de Drenagem');
    console.log('- npm run task-master status  : Verifica o estado dos Inboxes');
    break;
}
