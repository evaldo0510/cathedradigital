# Checklist de Qualidade Visual - Cathedra Digital

## 1. Tipografia e Hierarquia
- [ ] **H1**: Reservado para o Hero. Deve usar `font-display` (Cinzel) e ter o maior peso visual.
- [ ] **H2**: Títulos de seção principais. Devem manter o alinhamento centralizado na landing.
- [ ] **H3**: Títulos de cards e subseções.
- [ ] **Corpo de Texto**: Máximo de 65 caracteres por linha para legibilidade. Uso de `text-muted-foreground` para descrição.
- [ ] **Fontes**:
    - Display: `Cinzel` (Premium/Espiritual)
    - Serif: `Playfair Display` (Elegante/Contemplativo)
    - Sans: `Inter` (Funcional/Moderno)

## 2. Espaçamento e Grid
- [ ] **Container**: Todas as seções devem usar a classe `.app-container` para alinhamento horizontal consistente (max 1280px).
- [ ] **Padding Vertical**: Seções devem usar `.section-spacing` (`py-24 md:py-48`) para garantir respiro visual.
- [ ] **Grid Gaps**: Grids responsivos devem usar `gap-8 md:gap-12` para manter a solidez.
- [ ] **Responsividade**: Verificar quebras em 768px (tablet) e 1024px (laptop pequeno).

## 3. Componentes e Estilos
- [ ] **Cards**: Usar `.desktop-card`. Bordas suaves (`rounded-3xl`), sombra leve e borda sutil.
- [ ] **Botões**:
    - Primário: Rounded-full, uppercase, tracking-widest, sem sombras pesadas.
    - Hover: Transição suave de cor ou escala mínima (1.02x).
- [ ] **Ícones**: Stroke width padronizado em `1.5` para aspecto premium e minimalista.
- [ ] **Sombras**: Evitar sombras escuras. Usar `shadow-sm` ou `shadow-md` com opacidade reduzida.

## 4. Cores e Contraste
- [ ] **Paleta**:
    - Deep Blue: `#0F172A` (Foco/Solidez)
    - Gold: `#D4AF37` (Acento/Sacralidade)
    - Cream White: `#F8F5EE` (Background/Paz)
- [ ] **Acessibilidade**: Garantir contraste mínimo de 4.5:1 para textos pequenos.

## 5. Performance e UX
- [ ] **Imagens**: Lazy-loading em todas as imagens abaixo do fold.
- [ ] **Interatividade**: Feedback visual claro em todos os elementos clicáveis (botões, links, cards).
- [ ] **Navegação**: Foco visível (`ring-primary`) para navegação via teclado.
