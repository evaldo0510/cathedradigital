import { chromium } from 'playwright';

async function runHealthcheck() {
  console.log('🚀 Iniciando Healthcheck de rotas críticas...');
  const browser = await chromium.launch({
    // executablePath removido para usar o padrão do ambiente
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/bible', name: 'Bíblia' },
    { path: '/catechism', name: 'Catecismo' },
    { path: '/santos', name: 'Santos' }
  ];

  let hasErrors = false;
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:8080';

  for (const route of routes) {
    console.log(`📡 Testando ${route.name} (${route.path})...`);
    
    const errors: string[] = [];
    page.on('pageerror', (err) => {
      errors.push(`Runtime Error: ${err.message}`);
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('transparenttextures.com')) return;
      errors.push(`Request Failed: ${url} (${req.failure()?.errorText})`);
    });



    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      
      const title = await page.title();
      if (!title || title.includes('Vite') || title.includes('Lovable')) {
        errors.push('Meta tag <title> parece estar com valor padrão ou ausente.');
      }

      if (errors.length > 0) {
        console.error(`❌ Falhas em ${route.name}:`);
        errors.forEach(e => console.error(`   - ${e}`));
        hasErrors = true;
      } else {
        console.log(`✅ ${route.name} saudável.`);
      }
    } catch (e) {
      console.error(`❌ Falha crítica ao acessar ${route.name}:`, e);
      hasErrors = true;
    }
    
    // Reset handlers
    page.removeAllListeners('pageerror');
    page.removeAllListeners('requestfailed');
  }

  await browser.close();

  if (hasErrors) {
    console.error('❌ Healthcheck falhou.');
    process.exit(1);
  } else {
    console.log('✅ Healthcheck concluído com sucesso.');
  }
}

runHealthcheck();
