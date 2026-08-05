import madge from 'madge';
import path from 'path';

async function checkCircularDependencies() {
  console.log('🔍 Verificando dependências circulares...');
  
  const res = await madge(path.join(process.cwd(), 'src'), {
    extensions: ['ts', 'tsx'],
    tsConfig: './tsconfig.app.json'
  });

  const circular = res.circular();

  if (circular.length > 0) {
    console.error('❌ Dependências circulares detectadas:');
    circular.forEach((path, index) => {
      console.error(`${index + 1}: ${path.join(' -> ')}`);
    });
    process.exit(1);
  } else {
    console.log('✅ Nenhuma dependência circular encontrada.');
  }
}

checkCircularDependencies().catch(err => {
  console.error('❌ Erro ao executar madge:', err);
  process.exit(1);
});
