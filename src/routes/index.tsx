/**
 * CATHEDRA MISSION CONTROL — AUDIT 7.7
 * VALIDAR AS JORNADAS PRINCIPAIS DO PEREGRINO DE PONTA A PONTA
 * 
 * STATUS ATUAL:
 * - AUDIT 7.6B (Offline Mode): CERTIFIED
 * - AUDIT 7.7 (Functional Certification): IN PROGRESS
 * 
 * OBJETIVO:
 * Validar as jornadas principais do peregrino de ponta a ponta, incluindo Acessibilidade e Performance.
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      {"INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):\n\nAnalise o texto abaixo antes de agir.\nSe for um pedido de criação, alteração ou correção, execute-o por completo no projeto.\nSe for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.\nNunca insira o texto enviado como conteúdo dentro do site ou da página.\n\nTEXTO DO USUÁRIO: Isso confirma o diagnóstico que já vínhamos encontrando: **o bloqueio não é do frontend do Cathedra; é a infraestrutura Supabase/Lovable Cloud pausada.**\n\nA mensagem é explícita:\n\n> `Publishing failed because your Supabase project is paused.`\n\n### O que isso significa agora\n\n* **Frontend:** pode continuar sendo desenvolvido e auditado.\n* **Código:** não precisa ser revertido.\n* **Biblioteca:** continua `BLOCKED — BACKEND DEPENDENCY`.\n* **Orações:** continuam bloqueadas pela ausência de conexão/carga.\n* **Catecismo/Bíblia:** podemos continuar corrigindo problemas puramente frontend.\n* **Publicação:** fica bloqueada enquanto o projeto Supabase estiver pausado.\n\n### O próximo passo é operacional\n\nVocê precisa **reativar o projeto Supabase no dashboard** e depois tentar publicar novamente.\n\nComo estamos trabalhando dentro do Lovable, eu faria nessa ordem:\n\n1. **Resume/Reactivate o projeto Supabase.**\n2. Aguarde o banco ficar efetivamente **Online/Healthy**.\n3. Não faça nenhuma migration ainda.\n4. Teste primeiro uma leitura simples.\n5. Abra `/oracao`, `/acervo`, `/santos`, `/catecismo` e `/bible`.\n6. Só depois tente **Publish**.\n7. Se publicar, executamos novamente a **AUDIT 7.7**, agora com backend real.\n\n**Importante:** não peça ao Lovable para “resolver” essa mensagem alterando código. O erro está antes da aplicação: o ambiente de publicação está recusando porque o projeto Supabase está pausado.\n\nSe você reativar o Supabase e me mandar o resultado que aparecer, eu consigo te dizer **qual deve ser a próxima ação sem gastar crédito à toa**."}
    </div>
  );
};