# Identidade Cathedra — Backlog Vivo

> Documento **vivo**. Cada onda da Sprint C0 adiciona itens à seção 8
> ("Débitos encontrados") conforme forem observados durante a homologação.
> Quando a Sprint I (Identidade) começar, este backlog será o input primário.
>
> **Origem:** governança aprovada em 2026-07-23 junto ao congelamento do
> plano C0 → K → I e à Regra 12 do COS (Homologação Sequencial).
>
> **Regra de uso durante a C0:**
> - Nada aqui é executado antes da Sprint I começar.
> - Apenas *registrar* o débito, com `arquivo:linha` e onda de origem.
> - Priorizar por frequência (quantas ondas relataram o mesmo débito).

---

## 1. Componentes

Auditoria de consistência dos primitivos visuais do Reader Template Master.

- **Hero** (`EditorialHero`) — variações, densidades, comportamento de subtítulo.
- **Cards** (`EditorialCard`) — densidades `dense` / `balanced` / `minimal`; uso correto por contexto.
- **Sidebar** — hierarquia, estados ativos, comportamento mobile.
- **Reader** (`ReaderShell` + `HeaderContext`) — respiração vertical, larguras.
- **Popovers** (`ReferencePopover`) — animação, skeleton, rodapé, densidade tipográfica.
- **Badges** — `NexusSourceBadge`, badges ICE, badges de espaço (Átrio/Igreja/Biblioteca/Claustro).

## 2. Ornamentação

Elementos gráficos que carregam a identidade contemplativa.

- Filetes editoriais (separadores finos, cor `--gold-on-dark`).
- Capitulares (letra inicial ornamentada em aberturas de capítulos).
- Versaletes (small caps próprios da escala tipográfica).
- Dourados (tokens `--gold` e `--gold-on-dark`; uso disciplinado).
- Padrões (tramas discretas para fundos de contexto litúrgico).
- Molduras (bordas editoriais para citações longas e blocos de rubrica).

## 3. Movimento

Movimento a serviço do silêncio, nunca do estímulo.

- Animações de entrada (fade + subida sutil, ≤ 240ms).
- Transições entre etapas de oração (respiração, não corte).
- Estados (hover, focus, active, loading) padronizados por token.
- Halos (foco visível editorial, não `outline` genérico do browser).
- Fades contemplativos entre mistérios / horas / estações.

## 4. Iconografia

Símbolos próprios do Cathedra além do Lucide.

- Símbolos próprios (marca, monograma, selo).
- Liturgia (cores litúrgicas como glifos, tempo litúrgico).
- Sacramentos (7 símbolos canônicos).
- Santos (glifos por categoria: mártir, doutor, virgem, confessor).
- Jornadas (glifos por eixo formativo).

## 5. Ilustrações

Arte editorial por módulo.

- Bíblia (aberturas de livro, decoração de capítulo).
- Rosário (20 mistérios — já parcialmente integrado via `mysteryImages.ts`).
- Via Sacra (14 estações).
- Missal (ciclo litúrgico, tempos, festas).
- Catequese (aberturas de lição, imagens de eixo).
- Santos (retratos ou ícones estilizados).

## 6. Áudio

Presença sonora contemplativa opcional.

- Sinos (marcação de horas canônicas).
- Gregoriano (aberturas e antífonas — biblioteca curada).
- Silêncio (marcador acústico de pausa em oração).
- Ambiente (drone contemplativo opcional em Modo Celebração).

## 7. Tipografia

Refinamento fino da escala já em produção (`src/styles/typography.css`).

- Títulos (revisar escala em headers ≥ `4xl`).
- Capitulares (definir componente próprio).
- Versaletes (padronizar uso em kickers e antífonas).
- Escalas (revisar `premium-*` para leitura longa em mobile).

## 8. Débitos encontrados

Preenchido automaticamente pelas ondas da C0. Formato:

```
- [C0.X · módulo] <descrição curta> — `arquivo:linha`
```

### C0.1 · Missal
_(sem débitos registrados)_

### C0.2 · Liturgia das Horas
- [C0.2 · LH] `OrdinaryBlockView` reimplementa cabeçalho + TTS por bloco em
  vez de reutilizar `LiturgyBlockCard`. Candidato à extensão do primitivo
  com variante "ordinary" — `src/components/cathedra/BreviaryContinuousReader.tsx:66`.
- [C0.2 · LH] Rodapé "Bendigamos ao Senhor" hardcoded no leitor; deveria
  virar um encerramento parametrizável do `LiturgyBlockCard` ou do
  `ReaderContinuation` litúrgico — `BreviaryContinuousReader.tsx:298-303`.

### C0.3 · Santos
_(pendente)_

### C0.4 · Rosário
_(pendente)_

### C0.5 · Via Sacra
_(pendente)_

### C0.6 · Bíblia
_(pendente)_

### C0.7 · Catecismo
_(pendente)_

### C0.8 · Jornadas
_(pendente)_

### C0.9 · Coleções
_(pendente)_

### C0.10 · ICE Universal
_(pendente)_
