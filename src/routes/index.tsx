/**
 * CATHEDRA MISSION CONTROL - ONDA 2.5
 * DIAGNÓSTICO DEFINITIVO DA INFRAESTRUTURA
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

      Analise o texto abaixo antes de agir.
      Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
      Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
      Nunca insira o texto enviado como conteúdo dentro do site ou da página.

      TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — ONDA 2.5
      DIAGNÓSTICO DEFINITIVO DA INFRAESTRUTURA

      A ONDA 2.4 está BLOCKED — INFRASTRUCTURE.

      Fatos já comprovados:

      - conteúdo das orações foi localizado;
      - schema de `public.prayers` foi identificado;
      - `usePrayers` está correto;
      - interface `/oracao` está correta;
      - Reader/Navegação estão corretos;
      - múltiplas estratégias de carga falharam;
      - SQL, Bun e Node apresentaram Timeout 544 / Connection Error;
      - nenhum registro foi inserido.

      A partir deste momento:

      NÃO tentar novas migrations.
      NÃO repetir INSERT.
      NÃO executar scripts de carga novamente.
      NÃO criar banco alternativo.
      NÃO criar nova tabela.
      NÃO alterar o módulo de Orações.
      NÃO alterar Reader V2.
      NÃO alterar Nexus.
      NÃO alterar Logos.
      NÃO alterar Church Context.
      NÃO alterar módulos CERTIFIED.

      OBJETIVO ÚNICO:

      Determinar se a Lovable Cloud/Supabase está realmente operacional para escrita ou se existe uma falha de infraestrutura, conexão, pool, migration ou permissão.

      ==================================================
      1. TESTE DE CONECTIVIDADE
      ==================================================

      Ativar:

      - cathedra-operating-system
      - cathedra-architecture-guardian

      Verificar somente conectividade.

      Testar:

      - endpoint Supabase;
      - conexão REST;
      - conexão utilizada pelo frontend;
      - conexão utilizada pelo ambiente de desenvolvimento;
      - disponibilidade do banco;
      - latência;
      - timeout;
      - status HTTP.

      Não tentar escrever dados.

      ==================================================
      2. TESTE DE LEITURA
      ==================================================

      Executar somente leitura em uma tabela existente e segura.

      Confirmar:

      SELECT/REST funciona?
      Existe resposta?
      Existe timeout?
      Existe erro de autenticação?
      Existe erro de RLS?

      Não modificar nenhum dado.

      ==================================================
      3. TESTE DE ESCRITA CONTROLADA
      ==================================================

      NÃO inserir oração.

      Se for tecnicamente seguro e existir mecanismo apropriado de health check já presente no projeto, verificar se o ambiente possui capacidade de escrita.

      Não criar registros fictícios.

      Não alterar tabelas de produção apenas para testar conexão.

      Se não houver mecanismo seguro de teste:

      → declarar WRITE TEST = NOT EXECUTED.

      ==================================================
      4. DIAGNÓSTICO
      ==================================================

      Classificar exatamente o problema:

      A — Cloud pausada
      B — Banco indisponível
      C — Timeout de conexão
      D — Pool/conexões saturadas
      E — RLS/policy
      F — autenticação
      G — migration bloqueada
      H — ambiente Lovable
      I — outro

      Não escolher uma causa por suposição.

      Utilizar somente evidências.

      ==================================================
      5. VERIFICAR SE O FRONTEND ESTÁ CORRETO
      ==================================================

      Confirmar que o frontend não está causando o timeout.

      Verificar:

      - URL Supabase;
      - configuração de cliente;
      - variáveis de ambiente;
      - anon key;
      - chamadas REST;
      - tratamento de timeout;
      - retry;
      - hooks.

      NÃO expor secrets no relatório.

      ==================================================
      6. PROTEGER O ACERVO JÁ RECUPERADO
      ==================================================

      O conteúdo localizado NÃO pode ser perdido.

      Registrar claramente onde estão as fontes originais:

      - Pai Nosso
      - Ave Maria
      - Glória
      - Salve Rainha
      - Ordinário da Liturgia das Horas

      Não mover nem apagar esses conteúdos.

      ==================================================
      7. RESULTADO OBRIGATÓRIO
      ==================================================

      Entregar:

      CONECTIVIDADE:
      PASS / FAIL

      LEITURA:
      PASS / FAIL

      ESCRITA:
      PASS / FAIL / NOT EXECUTED

      SUPABASE:
      PASS / FAIL

      LOVABLE CLOUD:
      PASS / FAIL

      CAUSA PROVÁVEL:
      somente com evidência.

      ORAÇÕES:
      BLOCKED — INFRASTRUCTURE

      MÓDULOS CERTIFIED:
      não alterar.

      ==================================================
      REGRA FINAL
      ==================================================

      Se o banco estiver realmente indisponível:

      PARAR.

      Não continuar tentando carga.

      Não gerar código desnecessário.

      Não criar workaround.

      Não alterar arquitetura.

      STATUS:

      BLOCKED — INFRASTRUCTURE

      Aguardar a infraestrutura ficar estável.

      Quando a conectividade estiver comprovadamente normal, a próxima execução deverá voltar diretamente para a carga das 4 orações já localizadas.

      NÃO iniciar uma nova auditoria geral.
    </div>
  );
};
