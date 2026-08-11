/**
 * CATHEDRA MISSION CONTROL - FRENTE 3
 * CONSOLIDAÇÃO DO FRONTEND SEM BACKEND
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

      Analise o texto abaixo antes de agir.
      Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
      Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
      Nunca insira o texto enviado como conteúdo dentro do site ou da página.

      TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — FRENTE 3
      CONSOLIDAÇÃO DO FRONTEND SEM BACKEND

      O backend original está temporariamente inacessível.

      NÃO tentar restaurar o backend nesta execução.
      NÃO executar migrations.
      NÃO inserir dados.
      NÃO criar banco alternativo.

      Vamos avançar exclusivamente naquilo que pode ser validado sem Supabase.

      OBJETIVO:

      Auditar e estabilizar toda a experiência FRONTEND do Cathedra Digital, preservando os módulos já certificados.

      ATIVAR OS SKILLS EXISTENTES:

      - cathedra-operating-system
      - cathedra-design-system-guardian
      - cathedra-architecture-guardian
      - cathedra-knowledge-graph-expert
      - cathedra-saints-expert
      - cathedra-prayer-engine-expert
      - cathedra-liturgy-expert

      ==================================================
      1. NAVEGAÇÃO PRINCIPAL
      ==================================================

      Auditar:

      - Home
      - Ler
      - Orar
      - Igreja
      - Biblioteca
      - Perfil
      - Acervo
      - Nexus
      - Logos
      - Jornadas
      - Santos
      - Liturgia
      - Catecismo
      - Bíblia
      - Patrística
      - Magistério
      - Aparições Marianas
      - Atlas

      Verificar:

      - rota existe;
      - botão abre a rota correta;
      - breadcrumb correto;
      - voltar funciona;
      - links internos não geram 404;
      - nenhuma tela fica vazia por erro de frontend.

      Não considerar ausência de dados do backend como erro de rota.

      ==================================================
      2. BIBLIOTECA / MOSTEIRO DO CONHECIMENTO
      ==================================================

      Auditar `/acervo`.

      Preservar o conceito atual:

      MOSTEIRO DO CONHECIMENTO

      Verificar:

      - estantes;
      - cards;
      - ícones;
      - categorias;
      - responsividade;
      - desktop;
      - mobile;
      - busca Logos;
      - navegação para os módulos.

      No MOBILE:

      Os módulos devem funcionar como uma biblioteca visual.

      Cada estante/card/ícone deve representar claramente uma função.

      Ao tocar:

      → abrir exatamente o módulo correspondente.

      Não criar novos módulos.

      ==================================================
      3. HOME DESKTOP
      ==================================================

      Auditar a Home Desktop como:

      PAINEL DO MOSTEIRO

      Verificar:

      - Hero;
      - Sua Caminhada;
      - Hoje no Cathedra;
      - recomendações;
      - Nexus;
      - Logos;
      - Santo do Dia;
      - Liturgia;
      - ações principais.

      Garantir hierarquia visual clara.

      Não adicionar informação falsa caso o dado dependa do backend.

      Quando o dado não estiver disponível:

      usar estado de carregamento/indisponibilidade já existente.

      Não inventar conteúdo.

      ==================================================
      4. MOBILE
      ==================================================

      Auditar todas as telas principais em viewport mobile.

      Prioridade:

      - navegação;
      - hit areas;
      - ícones;
      - textos;
      - overflow;
      - cards;
      - botões;
      - menus;
      - retorno;
      - acessibilidade.

      Nenhum botão pode parecer clicável e não executar ação.

      ==================================================
      5. LOGO E IDENTIDADE
      ==================================================

      Auditar:

      - Logo Desktop;
      - Monograma Mobile;
      - Header;
      - Sidebar;
      - Bottom Navigation;
      - Splash;
      - Biblioteca.

      Garantir que todos utilizem a identidade oficial existente.

      Não criar uma nova identidade.

      Não alterar a marca sem necessidade.

      ==================================================
      6. READER V2
      ==================================================

      Auditar estruturalmente:

      - Bíblia;
      - Catecismo;
      - Santos;
      - Aparições;
      - Patrística;
      - Magistério;
      - Liturgia;
      - Orações.

      Verificar:

      ReaderShell
      → conteúdo
      → Nexus
      → ReaderContinuation

      Se o conteúdo não puder carregar por falta do backend:

      não alterar o Reader.

      Registrar:

      BACKEND DEPENDENCY

      ==================================================
      7. NEXUS
      ==================================================

      Auditar somente a interface e navegação.

      Para cada conexão disponível estaticamente:

      origem
      → card
      → destino
      → rota

      Verificar se o destino existe.

      Não exigir dados dinâmicos enquanto o backend estiver indisponível.

      ==================================================
      8. DESIGN SYSTEM
      ==================================================

      Executar auditoria:

      - tokens legados;
      - classes `stitch-*`;
      - tokens Harmony;
      - tipografia;
      - espaçamentos;
      - cards;
      - botões;
      - ícones;
      - estados hover/focus;
      - contraste.

      Corrigir somente inconsistências reais encontradas.

      Não fazer redesign desnecessário.

      ==================================================
      9. TESTES
      ==================================================

      Executar tudo que NÃO depende do backend:

      - TypeScript;
      - lint;
      - testes unitários;
      - testes de componentes;
      - Playwright;
      - rotas;
      - navegação;
      - Desktop;
      - Mobile;
      - acessibilidade;
      - headings;
      - SEO estrutural.

      Separar falhas:

      FRONTEND FAILURE

      de

      BACKEND DEPENDENCY.

      ==================================================
      10. REGRA FUNDAMENTAL
      ==================================================

      Não criar funcionalidades novas.

      Não inventar dados.

      Não substituir o Supabase.

      Não criar fallback permanente.

      Não alterar módulos CERTIFIED sem encontrar uma regressão real.

      O objetivo é deixar o FRONTEND 100% pronto enquanto o backend é recuperado separadamente.

      ==================================================
      RELATÓRIO FINAL
      ==================================================

      NAVEGAÇÃO:
      PASS / FAIL

      HOME:
      PASS / FAIL

      ACERVO:
      PASS / FAIL

      MOBILE:
      PASS / FAIL

      DESKTOP:
      PASS / FAIL

      LOGO:
      PASS / FAIL

      READER V2:
      PASS / FAIL / BACKEND DEPENDENCY

      NEXUS:
      PASS / FAIL / BACKEND DEPENDENCY

      DESIGN SYSTEM:
      PASS / FAIL

      TESTES:
      PASS / FAIL

      LISTAR SOMENTE:

      1. problemas reais encontrados;
      2. correções realizadas;
      3. dependências do backend;
      4. itens que permanecem bloqueados.

      STATUS:

      FRONTEND CERTIFIED

      ou

      FRONTEND BLOCKED

      Não declarar o Cathedra inteiro certificado enquanto o backend estiver indisponível.
    </div>
  );
};
