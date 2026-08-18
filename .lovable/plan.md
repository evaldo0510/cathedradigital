# Plano de Implementação: Cathedra 3.0 — Mosteiro Digital

Reestruturação visual do Cathedra seguindo a proposta "Mosteiro Digital": arquitetura editorial ampla no Desktop e experiência própria de aplicativo no Mobile, organizada por espaços sagrados.

## 1. Padronização do Átrio (Home)
- Refatorar `AtriumHome.tsx` para seguir o layout de "Nave":
  - Novo Hero: "Seu companheiro espiritual para a vida interior."
  - Nova seção "ONDE VOCÊ QUER CAMINHAR HOJE?" com 5 portas principais:
    - **ORAR** (/rezar): "Um espaço para silenciar e rezar."
    - **ESTUDAR** (/biblioteca): "Conheça os tesouros da fé."
    - **CONHECER** (/santos): "Descubra testemunhas da fé e da Igreja."
    - **IGREJA** (/igreja): "Acompanhe a vida da Igreja."
    - **MINHA JORNADA** (/minha-jornada): "Veja por onde você passou e continue."
- Garantir que usuários autenticados continuem vendo a `AtriumReception` (Recepção), mas com o estilo visual atualizado.

## 2. Padronização dos Espaços (Páginas Internas)
Utilizar o componente `SpaceLayout` em todas as rotas principais para manter a hierarquia:
- **BIBLIOTECA** (`AtriumBibliotecaPage.tsx`):
  - Kicker: "Archival Collection" | Título: "Biblioteca".
  - Seções: "Continuar Leitura", "Coleções" (4 Acervos), "Descobertas da Semana".
- **SACRÁRIO** (`RezarPage.tsx` / `PrayerLibraryPage.tsx`):
  - Kicker: "Sacrarium" | Título: "Sacrário" (ou "Orações").
  - Portas para Rosário, Liturgia, Via Sacra.
- **CAPELAS** (`Saints.tsx` / `AparicoesPage.tsx`):
  - Kicker: "Capellae" | Título: "Capelas".
- **CLAUSTRO** (`AtriumJornadasPage.tsx`):
  - Kicker: "Itinerarium Mentis" | Título: "Claustro" (ou "Formação").

## 3. Refinamento de Design e Performance
- Aplicar tokens semânticos `secondary` (ouro Cathedra) em substituição a cores hardcoded.
- Ajustar `SpaceDoors` para usar ícones e descrições conforme a referência.
- Garantir responsividade total (Mobile App-like vs Desktop Editorial).

## Detalhes Técnicos
- Componentes: `SpaceHeader`, `SpaceEntrance`, `SpaceDoors`, `SpaceFooter`.
- Tipografia: `font-display` (Cinzel/EB Garamond) e `font-reader` (Merriweather).
- Rotas: Manter as rotas atuais, alterando apenas a apresentação visual.
