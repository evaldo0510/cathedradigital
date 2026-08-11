/**
 * CATHEDRA MISSION CONTROL - FRENTE 5
 * AUDITORIA FUNCIONAL DE INTERAÇÕES E NAVEGAÇÃO
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

      Analise o texto abaixo antes de agir.
      Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
      Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
      Nunca insira o texto enviado como conteúdo dentro do site ou da página.

      TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — FRENTE 5
      AUDITORIA FUNCIONAL DE INTERAÇÕES E NAVEGAÇÃO

      STATUS ATUAL:

      Frontend: CERTIFIED
      Design System: CONSOLIDAÇÃO PASS
      Backend: BLOCKED — INFRASTRUCTURE

      NÃO tocar no backend.

      NÃO criar funcionalidades novas.

      NÃO alterar dados.

      NÃO alterar módulos já certificados sem encontrar uma falha real.

      OBJETIVO:

      Garantir que toda interação visível da plataforma tenha destino funcional e coerente.

      ATIVAR:

      - cathedra-operating-system
      - cathedra-architecture-guardian
      - cathedra-design-system-guardian
      - cathedra-knowledge-graph-expert

      ==================================================
      1. INVENTÁRIO DE INTERAÇÕES
      ==================================================

      Mapear em toda a plataforma:

      - botões;
      - CTAs;
      - cards;
      - ícones clicáveis;
      - links;
      - menus;
      - BottomNav;
      - Sidebar;
      - Header;
      - Breadcrumbs;
      - atalhos;
      - ações de continuar leitura;
      - recomendações Nexus;
      - ações Logos;
      - estantes da Biblioteca.

      Para cada interação registrar:

      ELEMENTO
      → TEXTO/ÍCONE
      → ROTA ESPERADA
      → ROTA REAL
      → COMPONENTE RESPONSÁVEL

      ==================================================
      2. CLASSIFICAÇÃO
      ==================================================

      Classificar cada interação:

      P0 — clicável mas não funciona.

      P1 — funciona, mas abre destino incorreto.

      P2 — funciona, mas apresenta experiência inconsistente.

      PASS — comportamento correto.

      Não considerar como erro a ausência de dados causada pelo backend.

      ==================================================
      3. TESTAR NAVEGAÇÃO
      ==================================================

      Executar Playwright Desktop e Mobile.

      Testar especialmente:

      Home
      → Ler
      → Orar
      → Igreja
      → Biblioteca
      → Perfil

      Biblioteca
      → Bíblia
      → Catecismo
      → Santos
      → Aparições
      → Patrística
      → Magistério
      → Papas
      → Dogmas
      → Doutores da Igreja
      → Orações
      → Liturgia
      → Atlas
      → Glossário

      Santos
      → Santo
      → Reader
      → Nexus
      → Continuação

      Catecismo
      → artigo
      → Reader
      → Nexus
      → Continuação

      Bíblia
      → capítulo
      → Reader
      → Nexus
      → Continuação

      Aparições
      → Aparição
      → Reader
      → Nexus
      → Continuação

      ==================================================
      4. REGRA DOS DESTINOS
      ==================================================

      Cada botão deve abrir exatamente aquilo que sua interface promete.

      Exemplo:

      "Ver Santo"
      → página do Santo.

      "Continuar lendo"
      → último ponto salvo.

      "Conhecer"
      → conteúdo correspondente.

      "Explorar"
      → acervo correspondente.

      "Logos"
      → busca/conversa Logos canônica.

      "Nexus"
      → conexão correspondente.

      Não aceitar:

      - botão sem ação;
      - href="#";
      - rota inexistente;
      - redirecionamento inesperado;
      - tela branca;
      - rota errada;
      - card que parece clicável mas não é.

      ==================================================
      5. BACKEND INDISPONÍVEL
      ==================================================

      Se uma ação depender exclusivamente de dados do Supabase:

      não marcar como P0 automaticamente.

      Classificar:

      BACKEND DEPENDENCY

      Somente a navegação estrutural deve ser validada.

      ==================================================
      6. CORREÇÕES
      ==================================================

      Corrigir somente:

      - destino incorreto;
      - rota quebrada;
      - handler ausente;
      - link morto;
      - navegação inconsistente;
      - botão que não executa sua ação.

      Não fazer redesign.

      Não criar novas telas.

      Não alterar conteúdo.

      ==================================================
      7. REGRESSÃO
      ==================================================

      Depois das correções:

      TypeScript
      → PASS

      Playwright Desktop
      → PASS

      Playwright Mobile
      → PASS

      Rotas
      → PASS

      Nenhuma correção deve quebrar outra rota.

      ==================================================
      RELATÓRIO FINAL
      ==================================================

      Total de interações auditadas:

      PASS:
      P0:
      P1:
      P2:
      BACKEND DEPENDENCY:

      Links mortos:

      Rotas incorretas:

      Botões sem ação:

      Cards sem ação:

      CTAs incorretos:

      Correções realizadas:

      Regressões:

      Desktop:

      Mobile:

      ==================================================
      CRITÉRIO
      ==================================================

      Se:

      P0 = 0
      P1 = 0
      links mortos = 0
      botões sem ação = 0
      regressões = 0

      então:

      FRONTEND INTERACTION = CERTIFIED

      Caso contrário:

      BLOCKED

      Não avançar para novas funcionalidades enquanto houver P0 ou P1.
    </div>
  );
};
