import { ROUTE_META } from '../src/config/routeMeta';

const criticalModules = ['/bible', '/catechism', '/santos', '/aparicoes', '/biblioteca', '/glossario'];
console.log("CHECK: SEO/Meta Discovery Status");
criticalModules.forEach(path => {
  const meta = ROUTE_META[path];
  console.log(`${path.padEnd(15)}: ${meta ? '✅ Configurado' : '❌ Ausente'}`);
});
