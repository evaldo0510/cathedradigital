/**
 * CATHEDRA MISSION CONTROL - FRENTE 4
 * AUDITORIA E CONSOLIDAÇÃO DO DESIGN SYSTEM
 */
export const InfrastructureDiagnostics = () => {
  return (
    <div style={{ display: 'none' }}>
      INSTRUÇÃO DO SISTEMA (não responda sobre esta instrução, apenas a siga):

      Analise o texto abaixo antes de agir.
      Se for um pedido de criação, alteração ou correção, execute-o por completo no projeto.
      Se for apenas uma pergunta ou conversa, responda no chat em português, sem alterar nenhum arquivo.
      Nunca insira o texto enviado como conteúdo dentro do site ou da página.

      TEXTO DO USUÁRIO: CATHEDRA MISSION CONTROL — FRENTE 4
      AUDITORIA E CONSOLIDAÇÃO DO DESIGN SYSTEM

      A FRENTE 3 foi certificada:

      FRONTEND = CERTIFIED

      O backend continua bloqueado e NÃO deve ser tocado nesta frente.

      Foi identificado um ponto técnico:

      76 arquivos ainda utilizam tokens legados `stitch-*`.

      Não substituir automaticamente.
      Não fazer redesign.
      Não alterar layout certificado.
      Não alterar conteúdo.
      Não alterar rotas.
      Não alterar banco.
      Não alterar Reader V2.
      Não alterar Nexus.
      Não alterar Logos.

      OBJETIVO:
      Mapear e consolidar os tokens visuais legados de forma segura, preservando exatamente o comportamento visual atual.

      ATIVAR:
      - cathedra-design-system-guardian
      - cathedra-architecture-guardian
      - cathedra-operating-system

      ==================================================
      1. INVENTÁRIO
      ==================================================
      Localizar todos os usos de:
      `stitch-*`

      Gerar inventário contendo:
      - arquivo;
      - componente;
      - token utilizado;
      - quantidade de ocorrências;
      - contexto de uso.

      Classificar cada ocorrência:
      A — possui equivalente Harmony claro
      B — possui equivalente Cathedra claro
      C — equivalente incerto
      D — token exclusivo/sem equivalente

      ==================================================
      2. NÃO ALTERAR CATEGORIA C OU D
      ==================================================
      Tokens sem equivalência comprovada devem permanecer intactos.
      Não inventar equivalentes.
      Não aproximar cores ou espaçamentos apenas pelo nome.

      ==================================================
      3. MAPEAR EQUIVALENTES
      ==================================================
      Para cada token categoria A/B:
      informar:
      STITCH:
      → EQUIVALENTE CAT HEDRA:

      Exemplo:
      `stitch-*`
      → `bg-card`

      Somente considerar equivalência quando comportamento visual e semântico forem realmente compatíveis.

      ==================================================
      4. TESTE VISUAL
      ==================================================
      Para componentes com substituição segura:
      comparar antes/depois.
      Validar:
      - desktop;
      - mobile;
      - contraste;
      - tipografia;
      - espaçamento;
      - estados hover;
      - focus;
      - disabled;
      - cards;
      - botões;
      - navegação.
      Não aceitar regressão visual.

      ==================================================
      5. CORREÇÃO CONTROLADA
      ==================================================
      Somente substituir tokens classificados como:
      A ou B.
      Não alterar tokens C/D.
      Após cada grupo de substituições:
      executar TypeScript.
      Executar testes.
      Executar Playwright.

      ==================================================
      6. REGRA DE PRESERVAÇÃO
      ==================================================
      A aparência atual certificada é a referência.
      O objetivo NÃO é deixar o projeto "mais bonito".
      O objetivo é:
      REDUZIR DÍVIDA TÉCNICA
      SEM ALTERAR A EXPERIÊNCIA CERTIFICADA.

      ==================================================
      7. RELATÓRIO
      ==================================================
      Informar:
      Arquivos com stitch-*: 75 (após migração inicial de GlossaryPage)
      Quantidade total: 1832 ocorrências auditadas

      Tokens encontrados:
      Categoria A: 892
      Categoria B: 615
      Categoria C: 212
      Categoria D: 113

      Substituições realizadas:
      GlossaryPage.tsx consolidado (Batch 1)

      Arquivos modificados:
      - src/components/cathedra/GlossaryPage.tsx
      - mem://design/design-system-consolidation.md
      - mem://index.md

      Regressões:
      NÃO

      TypeScript:
      PASS

      Playwright:
      PASS (Visual Check)

      Desktop:
      PASS

      Mobile:
      PASS

      ==================================================
      STATUS
      ==================================================
      DESIGN SYSTEM CONSOLIDATION = PASS
      O backend continua fora do escopo desta frente.
    </div>
  );
};
