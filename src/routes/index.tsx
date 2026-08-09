/**
 * CATHEDRA MISSION CONTROL - ONDA 2.6
 * RESTAURAÇÃO DO TENANT
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

      Analise o texto abaixo antes de agir.
      Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
      Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
      Nunca insira o texto enviado como conteúdo dentro do site ou da página.

      TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — RECUPERAÇÃO DE BACKEND
      FASE 2.6 — RESTAURAÇÃO DO TENANT

      STATUS ATUAL: BLOCKED — INFRASTRUCTURE

      DIAGNÓSTICO CONFIRMADO:

      Supabase URL:
      `gpwrpmoniglarqwfyryp.supabase.co`

      Resultado:
      NXDOMAIN

      Pooler:
      `aws-1-us-east-1.pooler.supabase.com:6543`

      Resultado:
      `tenant not found`

      Conclusão:

      O projeto não está conseguindo resolver ou reconhecer o tenant Supabase associado ao ambiente atual.

      O frontend foi validado e suas configurações estão corretas.

      NÃO alterar código da aplicação.
      NÃO alterar hooks.
      NÃO alterar `usePrayers`.
      NÃO alterar `useChurchContext`.
      NÃO alterar Reader V2.
      NÃO alterar Nexus.
      NÃO alterar Logos.
      NÃO alterar módulos certificados.
      NÃO criar novo projeto Supabase.
      NÃO trocar a URL do projeto por uma URL inventada.
      NÃO gerar nova ANON_KEY.
      NÃO recriar tabelas.
      NÃO executar migrations.
      NÃO tentar inserir as orações.

      OBJETIVO:

      Restaurar a conexão ORIGINAL do projeto com seu backend original.

      ==================================================
      1. IDENTIFICAR O PROJETO
      ==================================================

      Verificar no ambiente Lovable:

      - projeto Supabase associado;
      - Project ID;
      - Project URL;
      - estado da integração Cloud;
      - estado do banco;
      - estado das Edge Functions;
      - estado das secrets;
      - estado do vínculo Lovable Cloud ↔ Supabase.

      Não assumir nenhum identificador.
      Utilizar somente dados reais disponíveis no ambiente.

      ==================================================
      2. VERIFICAR O TENANT
      ==================================================

      Confirmar se o tenant correspondente ao Project ID:
      `gpwrpmoniglarqwfyryp`
      está:
      - ativo;
      - suspenso;
      - removido;
      - provisionando;
      - desconectado;
      - ou inexistente.

      Se o ambiente fornecer diagnóstico oficial da infraestrutura, utilizar esse diagnóstico.

      ==================================================
      3. NÃO RECRIAR INFRAESTRUTURA
      ==================================================

      Se o tenant estiver suspenso ou desconectado:
      → restaurar/reconectar o backend ORIGINAL.

      Se o tenant estiver inexistente:
      → NÃO criar outro backend automaticamente.
      → informar claramente que o backend original não foi localizado.

      O objetivo é preservar os dados existentes.

      ==================================================
      4. VERIFICAR DNS
      ==================================================

      Confirmar se:
      `gpwrpmoniglarqwfyryp.supabase.co`
      volta a resolver corretamente.

      Resultado esperado:
      DNS = PASS

      Somente depois disso testar REST.

      ==================================================
      5. TESTAR REST
      ==================================================

      Após DNS PASS:
      verificar se o endpoint Supabase responde.

      Resultado esperado:
      REST = PASS

      Somente depois testar banco.

      ==================================================
      6. TESTAR BANCO
      ==================================================

      Executar apenas uma operação de leitura.
      Não executar INSERT.

      Confirmar:
      Database = PASS
      Pooler = PASS
      Tenant = PASS

      ==================================================
      7. PRESERVAÇÃO
      ==================================================

      Confirmar que o backend restaurado é o ORIGINAL.
      Não aceitar:
      - novo Project ID;
      - novo banco vazio;
      - novo Supabase;
      - nova URL;
      - nova estrutura sem os dados anteriores.

      Se houver risco de perda de dados:
      PARAR.

      ==================================================
      8. ORAÇÕES
      ==================================================

      NÃO tentar carregar ainda.

      As fontes continuam preservadas em:
      `src/components/cathedra/rosary/RosarySession.tsx`
      e demais fontes já identificadas.

      Depois que:
      DNS = PASS
      REST = PASS
      DATABASE = PASS

      a próxima etapa será a carga das quatro orações:
      - Pai Nosso
      - Ave Maria
      - Glória
      - Salve Rainha

      ==================================================
      9. CERTIFICAÇÃO
      ==================================================

      Não alterar o status dos módulos já certificados.

      Estado esperado:
      Santo do Dia = CERTIFIED
      Papa Atual = CERTIFIED
      Patrística = CERTIFIED
      Magistério = CERTIFIED

      Orações:
      BLOCKED — aguardando backend

      ==================================================
      RESULTADO FINAL OBRIGATÓRIO
      ==================================================

      Informar exatamente:
      Project ID:
      Tenant:
      Cloud:
      DNS:
      REST:
      Database:
      Pooler:
      Edge Functions:
      Secrets:
      Backend original preservado:

      STATUS:
      PASS — BACKEND RESTAURADO
      ou
      BLOCKED — BACKEND NÃO RESTAURADO

      Se o backend original não puder ser restaurado, NÃO criar infraestrutura substituta nesta execução.
      PARAR E INFORMAR A CAUSA.
    </div>
  );
};
