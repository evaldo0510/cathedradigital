import { CATECHISM_LOCAL_DATA } from '../src/data/catechism';

console.log('🔍 Iniciando validação do Catecismo local...');

const items = Object.values(CATECHISM_LOCAL_DATA);
const errors: string[] = [];

items.forEach((item: any) => {
  const ref = `§${item.paragraph}`;
  
  if (!item.id) errors.push(`[${ref}] ID ausente.`);
  if (!item.paragraph || typeof item.paragraph !== 'number') errors.push(`[${ref}] Parágrafo inválido ou ausente.`);
  
  // Consistency checks
  if (item.tipo !== 'catecismo') errors.push(`[${ref}] Campo 'tipo' inconsistente: esperado 'catecismo', recebido '${item.tipo}'.`);
  if (item.type !== 'catechism') errors.push(`[${ref}] Campo 'type' inconsistente: esperado 'catechism', recebido '${item.type}'.`);
  
  if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) {
    errors.push(`[${ref}] Tags vazias ou ausentes.`);
  }

  if (!item.titulo || item.titulo.trim() === '') errors.push(`[${ref}] Título ausente.`);
  if (!item.conteudo || item.conteudo.trim() === '') errors.push(`[${ref}] Conteúdo ausente.`);
});

if (errors.length > 0) {
  console.error('❌ Validação falhou! Erros encontrados:');
  errors.forEach(err => console.error('  - ' + err));
  process.exit(1);
}

console.log(`✅ Sucesso! ${items.length} registros validados corretamente.`);
process.exit(0);
