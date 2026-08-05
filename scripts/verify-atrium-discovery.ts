import { ROUTE_META } from '../src/config/routeMeta';

const modules = ['/bible', '/catechism', '/saints', '/aparicoes', '/biblioteca', '/glossario', '/acervo'];
console.log("Discovery SEO Audit:");
modules.forEach(path => {
  const meta = ROUTE_META[path];
  console.log(`${path.padEnd(15)}: ${meta ? '✅ OK' : '❌ MISSING'}`);
});
