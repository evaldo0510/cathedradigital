# Relatório de Integração - TemaDetailPage

**Status:** ❌ PENDENTE
- **Data:** 4/25/2026, 4:38:53 AM
- **Total:** 30
- **Sucessos:** 16
- **Falhas:** 14
- **Duração:** 29.20s

## 🏎️ Race Conditions & Performance
- ✅ **simulates fetch abort and ensures UI stability** (TemaDetailPage.advanced.test.tsx)
- ❌ **ensures no content leakage when switching between content and empty categories** (TemaDetailPage.test.tsx)
- ❌ **handles rapid multi-switch without skeleton accumulation** (TemaDetailPage.test.tsx)
- ❌ **ensures only the latest resolved request updates the UI (race condition protection)** (TemaDetailPage.test.tsx)
- ❌ **alternates rapidly between tabs with different response times and validates content** (TemaDetailPage.test.tsx)
- ❌ **handles tab switching with micro-delays and ensures stable UI state** (TemaDetailPage.test.tsx)
- ✅ **prevents multiple requests when "Try Again" is clicked twice rapidly** (TemaDetailPage.test.tsx)
- ❌ **handles 15+ rapid tab switches without skeleton accumulation** (TemaDetailPage.test.tsx)
- ❌ **ensures stale responses from previous tabs are ignored (race condition)** (TemaDetailPage.test.tsx)
- ❌ **validates that fetch is debounced during rapid tab switching** (TemaDetailPage.test.tsx)

## 🔄 Retry & Error Flows
- ✅ **handles error state and retry button via keyboard**
- ✅ **displays error message with "Try Again" button when fetch fails**
- ✅ **verifies retry flow: error -> retry -> success/fallback**
- ✅ **handles fetch exception by showing global error UI across all tabs**
- ❌ **shows loading state during retry and resolves correctly**
- ❌ **verifies that each category fallback appears only in its corresponding tab during loading error**
- ✅ **confirms that error fallback persists if retry also fails**
- ✅ **prevents multiple requests when "Try Again" is clicked twice rapidly**
- ❌ **verifies that each category shows its specific error message and it updates after success**
- ❌ **verifies retry button accessibility states (aria-busy)**

## ⌨️ Accessibility & ARIA
- ✅ **validates accessibility roles and attributes for Tabs**
- ✅ **handles error state and retry button via keyboard**
- ✅ **shows skeletons during keyboard-triggered navigation**
- ❌ **validates skeleton location and accessibility in the active TabsContent**
- ❌ **verifies retry button accessibility states (aria-busy)**

## ❌ Detalhes das Falhas
### renders specific empty states for each category and ensures no leaking labels
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Conteúdo da Tradição em aprofundamento/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mVazio[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-orbit w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<circle[39m
                  [33mcx[39m=[32m"12"[39m
                  [33mcy[39m=[32m"12"[39m
                  [33mr[39m=[32m"3"[39m
                [36m/>[39m
                [36m<circle[39m
                  [33mcx[39m=[32m"19"[39m
                  [33mcy[39m=[32m"5"[39m
                  [33mr[39m=[32m"2"[39m
                [36m/>[39m
                [36m<circle[39m
                  [33mcx[39m=[32m"5"[39m
                  [33mcy[39m=[32m"19"[39m
                  [33mr[39m=[32m"2"[39m
                [36m/>[39m
                [36m<path[39m
                  [33md[39m=[32m"M10.4 21.9a10 10 0 0 0 9.941-15.416"[39m
                [36m/>[39m
                [36m<path[39m
                  [33md[39m=[32m"M13.5 2.1a10 10 0 0 0-9.841 15.416"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mVazio[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
              [33mstroke[39m=[32m"currentColor"[39m
              [33mstroke-linecap[39m=[32m"r...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:105:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### ensures no content leakage when switching between content and empty categories
**Arquivo:** TemaDetailPage.test.tsx
```
Error: [2mexpect([22m[31melement[39m[2m).not.toBeInTheDocument()[22m

[31mexpected document not to contain element, found <p
  class="text-base sm:text-lg text-foreground/80 leading-relaxed font-serif"
>
  "Bible Content"
</p> instead[39m
    at Proxy.expectWrapper (file:///dev-server/node_modules/.bun/@vitest+expect@3.2.4/node_modules/@vitest/expect/dist/index.js:1745:12)
    at Proxy.<anonymous> (file:///dev-server/node_modules/.bun/@vitest+expect@3.2.4/node_modules/@vitest/expect/dist/index.js:1029:14)
    at Proxy.toBeInTheDocument (file:///dev-server/node_modules/.bun/chai@5.3.3/node_modules/chai/index.js:1686:25)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:251:54
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### handles rapid multi-switch without skeleton accumulation
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Journey Data/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mRapidSwitch[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mRapidSwitch[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:278:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### ensures only the latest resolved request updates the UI (race condition protection)
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Magisterium Wins/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mRace[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mRace[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
    ...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:315:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### shows loading state during retry and resolves correctly
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Erro ao carregar conexões .* no Nexus/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mDisableRetry[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mDisableRetry[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[3...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:334:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at runSuite (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)
```
### verifies that each category fallback appears only in its corresponding tab during loading error
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Erro ao carregar conexões .* no Nexus/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mCategoryError[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mCategoryError[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:377:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:155:11
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:26
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1897:20
    at new Promise (<anonymous>)
    at runWithTimeout (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1863:10)
    at runTest (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1574:12)
    at runSuite (file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:1729:8)
```
### alternates rapidly between tabs with different response times and validates content
**Arquivo:** TemaDetailPage.test.tsx
```
TypeError: resolvers[2] is not a function
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:419:19
    at /dev-server/node_modules/.bun/@testing-library+react@16.3.2+b41f8805ee63d2ff/node_modules/@testing-library/react/dist/act-compat.js:47:24
    at act (/dev-server/node_modules/.bun/react@18.3.1/node_modules/react/cjs/react.development.js:2512:16)
    at Proxy.act (/dev-server/node_modules/.bun/@testing-library+react@16.3.2+b41f8805ee63d2ff/node_modules/@testing-library/react/dist/act-compat.js:46:25)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:418:11
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### handles tab switching with micro-delays and ensures stable UI state
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Nenhuma jornada específica vinculada a este tema/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mDebounce[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mDebounce[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:473:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### verifies that each category shows its specific error message and it updates after success
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: /Erro ao carregar conexões de Tradição no Nexus/i. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mErrors[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mErrors[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:521:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### validates skeleton location and accessibility in the active TabsContent
**Arquivo:** TemaDetailPage.test.tsx
```
TestingLibraryElementError: Unable to find an accessible element with the role "tabpanel"

Here are the accessible roles:

  navigation:

  Name "":
  [36m<nav[39m
    [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
  [36m/>[39m

  --------------------------------------------------
  button:

  Name "Início":
  [36m<button[39m
    [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
  [36m/>[39m

  Name "Temas":
  [36m<button[39m
    [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
  [36m/>[39m

  Name "fundamentos":
  [36m<button[39m
    [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
  [36m/>[39m

  Name "Insight do Logos":
  [36m<button[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
  [36m/>[39m

  Name "Tentar Novamente":
  [36m<button[39m
    [33maria-busy[39m=[32m"false"[39m
    [33maria-live[39m=[32m"polite"[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm font-bold uppercase tracking-[0.15em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-95 shadow-sm hover:shadow-md border-2 border-secondary bg-white text-primary hover:bg-secondary/10 py-3 h-10 rounded-xl px-6"[39m
    [33mdata-testid[39m=[32m"retry-button"[39m
  [36m/>[39m

  --------------------------------------------------
  banner:

  Name "":
  [36m<header[39m
    [33mclass[39m=[32m"space-y-6"[39m
  [36m/>[39m

  --------------------------------------------------
  heading:

  Name "Skeleton":
  [36m<h1[39m
    [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
  [36m/>[39m

  Name "Temas Relacionados":
  [36m<h3[39m
    [33mclass[39m=[32m"text-xs font-black uppercase tracking-widest text-foreground/60"[39m
  [36m/>[39m

  --------------------------------------------------
  tablist:

  Name "":
  [36m<div[39m
    [33maria-orientation[39m=[32m"horizontal"[39m
    [33mclass[39m=[32m"h-10 items-center justify-center text-muted-foreground w-full bg-muted/40 p-1 rounded-2xl border border-border/40 grid grid-cols-4"[39m
    [33mdata-orientation[39m=[32m"horizontal"[39m
    [33mrole[39m=[32m"tablist"[39m
    [33mstyle[39m=[32m"outline: none;"[39m
    [33mtabindex[39m=[32m"0"[39m
  [36m/>[39m

  --------------------------------------------------
  tab:

  Name "Escrituras":
  [36m<button[39m
    [33maria-controls[39m=[32m"radix-:r2l:-content-bible"[39m
    [33maria-selected[39m=[32m"true"[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center whitespace-nowrap px-3 ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5"[39m
    [33mdata-orientation[39m=[32m"horizontal"[39m
    [33mdata-radix-collection-item[39m=[32m""[39m
    [33mdata-state[39m=[32m"active"[39m
    [33mid[39m=[32m"radix-:r2l:-trigger-bible"[39m
    [33mrole[39m=[32m"tab"[39m
    [33mtabindex[39m=[32m"-1"[39m
    [33mtype[39m=[32m"button"[39m
  [36m/>[39m

  Name "Tradição":
  [36m<button[39m
    [33maria-controls[39m=[32m"radix-:r2l:-content-tradition"[39m
    [33maria-selected[39m=[32m"false"[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center whitespace-nowrap px-3 ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5"[39m
    [33mdata-orientation[39m=[32m"horizontal"[39m
    [33mdata-radix-collection-item[39m=[32m""[39m
    [33mdata-state[39m=[32m"inactive"[39m
    [33mid[39m=[32m"radix-:r2l:-trigger-tradition"[39m
    [33mrole[39m=[32m"tab"[39m
    [33mtabindex[39m=[32m"-1"[39m
    [33mtype[39m=[32m"button"[39m
  [36m/>[39m

  Name "Magistério":
  [36m<button[39m
    [33maria-controls[39m=[32m"radix-:r2l:-content-magisterium"[39m
    [33maria-selected[39m=[32m"false"[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center whitespace-nowrap px-3 ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5"[39m
    [33mdata-orientation[39m=[32m"horizontal"[39m
    [33mdata-radix-collection-item[39m=[32m""[39m
    [33mdata-state[39m=[32m"inactive"[39m
    [33mid[39m=[32m"radix-:r2l:-trigger-magisterium"[39m
    [33mrole[39m=[32m"tab"[39m
    [33mtabindex[39m=[32m"-1"[39m
    [33mtype[39m=[32m"button"[39m
  [36m/>[39m

  Name "Jornadas":
  [36m<button[39m
    [33maria-controls[39m=[32m"radix-:r2l:-content-journeys"[39m
    [33maria-selected[39m=[32m"false"[39m
    [33mclass[39m=[32m"inline-flex items-center justify-center whitespace-nowrap px-3 ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl text-[10px] font-black uppercase tracking-widest py-2.5"[39m
    [33mdata-orientation[39m=[32m"horizontal"[39m
    [33mdata-radix-collection-item[39m=[32m""[39m
    [33mdata-state[39m=[32m"inactive"[39m
    [33mid[39m=[32m"radix-:r2l:-trigger-journeys"[39m
    [33mrole[39m=[32m"tab"[39m
    [33mtabindex[39m=[32m"-1"[39m
    [33mtype[39m=[32m"button"[39m
  [36m/>[39m

  --------------------------------------------------
  paragraph:

  Name "":
  [36m<p[39m
    [33mclass[39m=[32m"text-lg font-bold text-red-600"[39m
  [36m/>[39m

  Name "":
  [36m<p[39m
    [33mclass[39m=[32m"text-sm text-muted-foreground italic max-w-md mx-auto"[39m
  [36m/>[39m

  Name "":
  [36m<p[39m
    [33mclass[39m=[32m"text-xs text-muted-foreground leading-relaxed italic"[39m
  [36m/>[39m

  Name "":
  [36m<p[39m
    [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-widest text-primary"[39m
  [36m/>[39m

  Name "":
  [36m<p[39m
    [33mclass[39m=[32m"text-[9px] text-muted-foreground/60"[39m
  [36m/>[39m

  --------------------------------------------------
  complementary:

  Name "":
  [36m<aside[39m
    [33mclass[39m=[32m"space-y-6"[39m
  [36m/>[39m

  --------------------------------------------------

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mSkeleton[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-skull w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<path[39m
                  [33md[39m=[32m"m12.5 17-.5-1-.5 1h1z"[39m
                [36m/>[39m
                [36m<path[39m
                  [33md[39m=[32m"M15 22a1 1 0 0 0 1-1v-1a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20v1a1 1 0 0 0 1 1z"[39m
                [36m/>[39m
                [36m<circle[39m
                  [33mcx[39m=[32m"15"[39m
                  [33mcy[39m=[32m"12"[39m
                  [33mr[39m=[32m"1"[39m
                [36m/>[39m
                [36m<circle[39m
                  [33mcx[39m=[32m"9"[39m
                  [33mcy[39m=[32m"12"[39m
                  [33mr[39m=[32m"1"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mSkeleton[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
              [33mstroke[39m=[32m"currentColor"[39m
              [33mstroke-linecap[39m=[32m"round"[39m
              [33mstroke-linejoin[39m=[32m"round"[39m
              [33mstroke-width[39m=[32m"2"[39m
              [33mviewBox...
    at Object.getElementError (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/config.js:37:19)
    at /dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:76:38
    at /dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:52:17
    at getByRole (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:95:19)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:543:32
    at runNextTicks (node:internal/process/task_queues:65:5)
    at listOnTimeout (node:internal/timers:549:9)
    at processTimers (node:internal/timers:523:7)
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### handles 15+ rapid tab switches without skeleton accumulation
**Arquivo:** TemaDetailPage.test.tsx
```
AssertionError: expected 0 to be greater than 0

Ignored nodes: comments, script, style
[36m<html>[39m
  [36m<head>[39m
    [36m<title>[39m
      [0mStress - Cathedra — Cathedra Digital[0m
    [36m</title>[39m
    [36m<link[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mhref[39m=[32m"https://cathedradigital.lovable.app/temas/stress"[39m
      [33mrel[39m=[32m"canonical"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre Stress."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"website"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:type"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://cathedradigital.lovable.app/temas/stress"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:url"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Stress - Cathedra — Cathedra Digital"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:title"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre Stress."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:image"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"summary_large_image"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:card"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Stress - Cathedra — Cathedra Digital"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:title"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre Stress."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:image"[39m
    [36m/>[39m
  [36m</head>[39m
  [36m<body>[39m
    [36m<div>[39m
      [36m<div[39m
        [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
        [36m/>[39m
        [36m<nav[39m
          [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
        [36m>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
          [36m>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
              [33mstroke[39m=[32m"currentColor"[39m
              [33mstroke-linecap[39m=[32m"round"[39m
              [33mstroke-linejoin[39m=[32m"round"[39m
              [33mstroke-width[39m=[32m"2"[39m
              [33mviewBox[39m=[32m"0 0 24 24"[39m
              [33mwidth[39m=[32m"24"[39m
              [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
            [36m>[39m
              [36m<path[39m
                [33md[39m=[32m"m15 18-6-6 6-6"[39m
              [36m/>[39m
            [36m</svg>[39m
            [0m Início[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
          [36m>[39m
            [0mTemas[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
          [36m>[39m
            [0mfundamentos[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<span[39m
            [33mclass[39m=[32m"text-primary/80"[39m
          [36m>[39m
            [0mStress[0m
          [36m</span>[39m
        [36m</nav>[39m
        [36m<header[39m
          [33mclass[39m=[32m"space-y-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex items-center gap-4"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
              [36m>[39m
                [36m<svg[39m
                  [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                  [33mfill[39m=[32m"none"[39m
                  [33mheight[39m=[32m"24"[39m
                  [33mstroke[39m=[32m"currentColor"[39m
                  [33mstroke-linecap[39m=[32m"round"[39m
                  [33mstroke-linejoin[39m=[32m"round"[39m
                  [33mstroke-width[39m=[32m"2"[39m
                  [33mviewBox[39m=[32m"0 0 24 24"[39m
                  [33mwidth[39m=[32m"24"[39m
                  [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                [36m>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"4"[39m
                    [33mx2[39m=[32m"20"[39m
                    [33my1[39m=[32m"9"[39m
                    [33my2[39m=[32m"9"[39m
                  [36m/>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"4"[39m
                    [33mx2[39m=[32m"20"[39m
                    [33my1[39m=[32m"15"[39m
                    [33my2[39m=[32m"15"[39m
                  [36m/>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"10"[39m
                    [33mx2[39m=[32m"8"[39m
                    [33my1[39m=[32m"3"[39m
                    [33my2[39m=[32m"...
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:596:66
    at runWithExpensiveErrorDiagnosticsDisabled (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/config.js:47:12)
    at checkCallback (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:124:77)
    at Timeout.checkRealTimersCallback (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:118:16)
    at listOnTimeout (node:internal/timers:588:17)
    at processTimers (node:internal/timers:523:7)
```
### verifies retry button accessibility states (aria-busy)
**Arquivo:** TemaDetailPage.test.tsx
```
Error: [2mexpect([22m[31melement[39m[2m).toHaveAttribute([22m[32m[32m"aria-busy"[32m[39m[2m, [22m[32m[32m"true"[32m[39m[2m) // element.getAttribute("aria-busy") === "true"[22m

Expected the element to have attribute:
[32m  aria-busy="true"[39m
Received:
[31m  aria-busy="false"[39m

Ignored nodes: comments, script, style
[36m<html>[39m
  [36m<head>[39m
    [36m<title>[39m
      [0mA11y - Cathedra — Cathedra Digital[0m
    [36m</title>[39m
    [36m<link[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mhref[39m=[32m"https://cathedradigital.lovable.app/temas/a11y"[39m
      [33mrel[39m=[32m"canonical"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre A11y."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"website"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:type"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://cathedradigital.lovable.app/temas/a11y"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:url"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"A11y - Cathedra — Cathedra Digital"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:title"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre A11y."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mproperty[39m=[32m"og:image"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"summary_large_image"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:card"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"A11y - Cathedra — Cathedra Digital"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:title"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"Explore conteúdos sagrados sobre A11y."[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:description"[39m
    [36m/>[39m
    [36m<meta[39m
      [33mcontent[39m=[32m"https://gpwrpmoniglarqwfyryp.supabase.co/storage/v1/object/public/public-assets/og-image.png"[39m
      [33mdata-rh[39m=[32m"true"[39m
      [33mname[39m=[32m"twitter:image"[39m
    [36m/>[39m
  [36m</head>[39m
  [36m<body>[39m
    [36m<div>[39m
      [36m<div[39m
        [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
        [36m/>[39m
        [36m<nav[39m
          [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
        [36m>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
          [36m>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
              [33mstroke[39m=[32m"currentColor"[39m
              [33mstroke-linecap[39m=[32m"round"[39m
              [33mstroke-linejoin[39m=[32m"round"[39m
              [33mstroke-width[39m=[32m"2"[39m
              [33mviewBox[39m=[32m"0 0 24 24"[39m
              [33mwidth[39m=[32m"24"[39m
              [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
            [36m>[39m
              [36m<path[39m
                [33md[39m=[32m"m15 18-6-6 6-6"[39m
              [36m/>[39m
            [36m</svg>[39m
            [0m Início[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
          [36m>[39m
            [0mTemas[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<button[39m
            [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
          [36m>[39m
            [0mfundamentos[0m
          [36m</button>[39m
          [36m<span[39m
            [33mclass[39m=[32m"opacity-30"[39m
          [36m>[39m
            [0m/[0m
          [36m</span>[39m
          [36m<span[39m
            [33mclass[39m=[32m"text-primary/80"[39m
          [36m>[39m
            [0mA11y[0m
          [36m</span>[39m
        [36m</nav>[39m
        [36m<header[39m
          [33mclass[39m=[32m"space-y-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"flex items-center gap-4"[39m
            [36m>[39m
              [36m<div[39m
                [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
              [36m>[39m
                [36m<svg[39m
                  [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                  [33mfill[39m=[32m"none"[39m
                  [33mheight[39m=[32m"24"[39m
                  [33mstroke[39m=[32m"currentColor"[39m
                  [33mstroke-linecap[39m=[32m"round"[39m
                  [33mstroke-linejoin[39m=[32m"round"[39m
                  [33mstroke-width[39m=[32m"2"[39m
                  [33mviewBox[39m=[32m"0 0 24 24"[39m
                  [33mwidth[39m=[32m"24"[39m
                  [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
                [36m>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"4"[39m
                    [33mx2[39m=[32m"20"[39m
                    [33my1[39m=[32m"9"[39m
                    [33my2[39m=[32m"9"[39m
                  [36m/>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"4"[39m
                    [33mx2[39m=[32m"20"[39m
                    [33my1[39m=[32m"15"[39m
                    [33my2[39m=[32m"15"[39m
                  [36m/>[39m
                  [36m<line[39m
                    [33mx1[39m=[32m"10"[39m
                    [33mx2[39m=[32m"8"[39m
                    [33my1[39m=[32m"3"[39m
                    [33my2[39m=[32m"21"[39m
         ...
    at Proxy.expectWrapper (file:///dev-server/node_modules/.bun/@vitest+expect@3.2.4/node_modules/@vitest/expect/dist/index.js:1745:12)
    at Proxy.<anonymous> (file:///dev-server/node_modules/.bun/@vitest+expect@3.2.4/node_modules/@vitest/expect/dist/index.js:1029:14)
    at Proxy.toHaveAttribute (file:///dev-server/node_modules/.bun/chai@5.3.3/node_modules/chai/index.js:1686:25)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:622:24
    at runWithExpensiveErrorDiagnosticsDisabled (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/config.js:47:12)
    at checkCallback (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:124:77)
    at Timeout.checkRealTimersCallback (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:118:16)
    at listOnTimeout (node:internal/timers:588:17)
    at processTimers (node:internal/timers:523:7)
```
### ensures stale responses from previous tabs are ignored (race condition)
**Arquivo:** TemaDetailPage.test.tsx
```
Error: Unable to find an element with the text: ACTIVE DATA. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.

Ignored nodes: comments, script, style
[36m<body>[39m
  [36m<div>[39m
    [36m<div[39m
      [33mclass[39m=[32m"space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto pb-24 px-4 relative"[39m
    [36m>[39m
      [36m<div[39m
        [33mclass[39m=[32m"fixed inset-0 bg-gradient-to-b from-blue-500/10 via-background to-background -z-10 pointer-events-none opacity-40"[39m
      [36m/>[39m
      [36m<nav[39m
        [33mclass[39m=[32m"flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none"[39m
      [36m>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors flex items-center gap-1"[39m
        [36m>[39m
          [36m<svg[39m
            [33mclass[39m=[32m"lucide lucide-chevron-left w-3 h-3"[39m
            [33mfill[39m=[32m"none"[39m
            [33mheight[39m=[32m"24"[39m
            [33mstroke[39m=[32m"currentColor"[39m
            [33mstroke-linecap[39m=[32m"round"[39m
            [33mstroke-linejoin[39m=[32m"round"[39m
            [33mstroke-width[39m=[32m"2"[39m
            [33mviewBox[39m=[32m"0 0 24 24"[39m
            [33mwidth[39m=[32m"24"[39m
            [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
          [36m>[39m
            [36m<path[39m
              [33md[39m=[32m"m15 18-6-6 6-6"[39m
            [36m/>[39m
          [36m</svg>[39m
          [0m Início[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mTemas[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<button[39m
          [33mclass[39m=[32m"hover:text-primary transition-colors"[39m
        [36m>[39m
          [0mfundamentos[0m
        [36m</button>[39m
        [36m<span[39m
          [33mclass[39m=[32m"opacity-30"[39m
        [36m>[39m
          [0m/[0m
        [36m</span>[39m
        [36m<span[39m
          [33mclass[39m=[32m"text-primary/80"[39m
        [36m>[39m
          [0mStale[0m
        [36m</span>[39m
      [36m</nav>[39m
      [36m<header[39m
        [33mclass[39m=[32m"space-y-6"[39m
      [36m>[39m
        [36m<div[39m
          [33mclass[39m=[32m"flex flex-col sm:flex-row sm:items-center justify-between gap-6"[39m
        [36m>[39m
          [36m<div[39m
            [33mclass[39m=[32m"flex items-center gap-4"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20"[39m
            [36m>[39m
              [36m<svg[39m
                [33mclass[39m=[32m"lucide lucide-hash w-8 h-8"[39m
                [33mfill[39m=[32m"none"[39m
                [33mheight[39m=[32m"24"[39m
                [33mstroke[39m=[32m"currentColor"[39m
                [33mstroke-linecap[39m=[32m"round"[39m
                [33mstroke-linejoin[39m=[32m"round"[39m
                [33mstroke-width[39m=[32m"2"[39m
                [33mviewBox[39m=[32m"0 0 24 24"[39m
                [33mwidth[39m=[32m"24"[39m
                [33mxmlns[39m=[32m"http://www.w3.org/2000/svg"[39m
              [36m>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"9"[39m
                  [33my2[39m=[32m"9"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"4"[39m
                  [33mx2[39m=[32m"20"[39m
                  [33my1[39m=[32m"15"[39m
                  [33my2[39m=[32m"15"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"10"[39m
                  [33mx2[39m=[32m"8"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
                [36m<line[39m
                  [33mx1[39m=[32m"16"[39m
                  [33mx2[39m=[32m"14"[39m
                  [33my1[39m=[32m"3"[39m
                  [33my2[39m=[32m"21"[39m
                [36m/>[39m
              [36m</svg>[39m
            [36m</div>[39m
            [36m<div>[39m
              [36m<div[39m
                [33mclass[39m=[32m"flex items-center gap-2 mb-1"[39m
              [36m>[39m
                [36m<span[39m
                  [33mclass[39m=[32m"text-[10px] font-black uppercase tracking-[0.3em] text-primary/60"[39m
                [36m>[39m
                  [0mfundamentos[0m
                [36m</span>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"w-1 h-1 rounded-full bg-primary/30"[39m
                [36m/>[39m
                [36m<div[39m
                  [33mclass[39m=[32m"inline-flex items-center rounded-full border px-2.5 py-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary/70"[39m
                [36m>[39m
                  [0mNexus[0m
                [36m</div>[39m
              [36m</div>[39m
              [36m<h1[39m
                [33mclass[39m=[32m"text-4xl sm:text-5xl font-black tracking-tight text-foreground"[39m
              [36m>[39m
                [0mStale[0m
              [36m</h1>[39m
            [36m</div>[39m
          [36m</div>[39m
          [36m<button[39m
            [33mclass[39m=[32m"inline-flex items-center justify-center gap-2.5 whitespace-nowrap text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 hover:shadow-md hover:bg-primary/90 py-3 rounded-2xl h-14 px-8 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"[39m
          [36m>[39m
            [36m<div[39m
              [33mclass[39m=[32m"absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer"[39m
            [36m/>[39m
            [36m<svg[39m
              [33mclass[39m=[32m"lucide lucide-sparkles w-5 h-5 mr-2 group-hover:rotate-12 transition-transform"[39m
              [33mfill[39m=[32m"none"[39m
              [33mheight[39m=[32m"24"[39m
  ...
    at waitForWrapper (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/wait-for.js:163:27)
    at findByText (/dev-server/node_modules/.bun/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/query-helpers.js:86:33)
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:676:25
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
### validates that fetch is debounced during rapid tab switching
**Arquivo:** TemaDetailPage.test.tsx
```
AssertionError: expected "spy" to be called 1 times, but got 0 times
    at /dev-server/src/components/cathedra/TemaDetailPage.test.tsx:703:41
    at file:///dev-server/node_modules/.bun/@vitest+runner@3.2.4/node_modules/@vitest/runner/dist/chunk-hooks.js:752:20
```
