# Cathedra 2.0 — Jornadas do Usuário

Seis jornadas críticas, cada uma com **objetivo, gatilho, telas percorridas, critério de sucesso e falhas a evitar**.
Base para wireframes e testes de usabilidade.

Arquétipos: Peregrino (P), Discípulo (D), Estudioso (E).

---

## Convenções

- **Passos** contados do gesto que sai do estado atual (abrir app = passo 0).
- **Critério de sucesso** é observável (métrica ou evento), não sensação.
- **Falha a evitar** é o comportamento que quebra a jornada e deve travar o wireframe.

---

## J1 — Primeiro acesso (P)

**Objetivo:** experimentar o Cathedra sem cadastrar-se e sair com vontade de voltar amanhã.
**Gatilho:** primeira abertura, anônimo.

**Passos**
0. Abre app → **Átrio** (versão genérica, sem login).
1. Vê Ritual do Dia + tempo litúrgico + santo do dia.
2. Toca **"Iniciar Escuta"** → 1 salmo curto guiado (áudio opcional, texto sempre).
3. Ao final, card: *"Quer salvar seu caminho?"* → login **opcional**, não bloqueante.
4. Sugestão única: Jornada de 7 dias "Introdução à Fé" com botão *"Talvez amanhã"*.

**Telas:** Átrio → Player de Ritual → Card de conclusão → (opcional) Login.

**Critério de sucesso**
- ≥70% dos primeiros acessos completam o Ritual do Dia.
- ≥30% voltam em ≤48h.
- Login não é pré-requisito para chegar ao passo 3.

**Falhas a evitar**
- Modal de cadastro na abertura.
- Áudio obrigatório (falha de rede quebra o fluxo).
- Mais de 1 CTA competindo no card final.
- Notificação push antes do primeiro consentimento explícito.

---

## J2 — Primeiro estudo (E) — **experiência-assinatura**

**Objetivo:** estudar um tema atravessando 6 fontes, salvar e ter opção de virar jornada.
**Gatilho:** usuário quer entender algo ("perdão", "sofrimento", "casamento").

**Passos**
0. Abre app → toca **Estudar** no bottom-nav.
1. Cai em **Por Tema** (porta principal). Digita "perdão".
2. Vê tela de **Estudo Composto** montada automaticamente:
   - Bíblia · CIC · Magistério · Padres · Concílio · Cânon · Aplicação prática.
3. Rola verticalmente pelas seções; cada citação abre no leitor via Nexus.
4. Barra lateral persistente: **[Salvar estudo] [Anotar no diário] [Compartilhar]**.
5. Ao final: card *"Continuar amanhã como Jornada de 7 dias?"* → sim vira Jornada personalizada em Formar-se.

**Telas:** Estudar → Busca de Tema → Estudo Composto → (opcional) Leitor com Nexus → Card final.

**Critério de sucesso**
- Tempo do gesto ao estudo montado ≤ 3s (cache) / ≤ 8s (miss).
- ≥40% dos usuários que abrem um estudo salvam ou anotam.
- ≥15% convertem em Jornada.

**Falhas a evitar**
- Tema sem cobertura mínima e sem aviso honesto ("Ainda não temos Padres para este tema").
- Perder o breadcrumb temático ao entrar em uma fonte específica.
- Estudo composto de qualidade dependente de IA sem curadoria.

---

## J3 — Primeira oração (D)

**Objetivo:** cumprir Laudes com foco total e sair com uma anotação no diário.
**Gatilho:** notificação matinal opt-in (6h por padrão).

**Passos**
0. Toca notificação → abre no **Átrio**, com Laudes já em destaque.
1. Toca **"Rezar Laudes"** → entra em **Modo Prece** (nav some, cromia escurece, popovers desligados).
2. Reza (áudio opcional; texto sempre presente).
3. Ao terminar, **um** botão: **"Anotar"** (opcional) → campo de 1 frase.
4. Sai do Modo Prece → volta ao Átrio com Ritual marcado ✓ e Continuidade atualizada.

**Telas:** Notificação → Átrio → Leitor de Laudes (Modo Prece) → Campo Anotar → Átrio atualizado.

**Critério de sucesso**
- ≥80% que abrem via notificação chegam ao fim da oração.
- Zero interrupções durante Modo Prece (sem popup, sem toast, sem badge piscando).
- Anotação salva em ≤2 toques.

**Falhas a evitar**
- Sugerir "próximo passo" antes do fim da oração.
- Manter bottom-nav visível em Modo Prece.
- Exigir login para anotar (permitir anônimo com aviso).

---

## J4 — Pesquisa (todos)

**Objetivo:** encontrar tudo o que o Cathedra tem sobre uma expressão, em qualquer fonte.
**Gatilho:** dúvida súbita ("videira verdadeira", "cân 204", "cic 1234").

**Passos**
0. Em qualquer tela: `⌘K` (desktop) ou botão de busca no header (mobile).
1. Digita — resultados aparecem em tempo real, **agrupados por fonte** com contagem.
2. Reconhece sintaxe: `jo 15` → João 15; `cic 1234` → CIC §1234; `st iii q8` → Suma; `cân 204`.
3. Toca resultado → abre no leitor com Nexus **já ativo** mostrando outras fontes.

**Telas:** Overlay ⌘K → Leitor da fonte escolhida com painel Nexus.

**Critério de sucesso**
- Primeiro resultado em ≤200ms (alvo perf inegociável).
- Sintaxe rápida acerta em 100% dos padrões documentados.
- Ao abrir resultado, Nexus mostra ≥1 fonte relacionada em ≥90% dos casos.

**Falhas a evitar**
- Modal fullscreen no mobile em vez de overlay contextual.
- Perder a query ao voltar do resultado (deve preservar histórico da sessão).
- Resultado sem indicação de fonte.

---

## J5 — Favoritos (D, E)

**Objetivo:** salvar algo agora e reencontrar depois, sem esforço.
**Gatilho:** leitura ou oração significativa.

**Passos**
0. Em qualquer conteúdo, toca ícone 🤍.
1. Toast discreto: *"Salvo em Favoritos"* com link "Ver".
2. Depois: **Minha Jornada → Favoritos**, agrupados por **fonte** e por **tema** (dois filtros).
3. Cada favorito abre no leitor original, com Nexus e Anotar disponíveis.

**Telas:** Leitor → toast → (depois) Minha Jornada → Favoritos → Leitor.

**Critério de sucesso**
- Salvar = 1 toque; reencontrar = ≤2 toques a partir do bottom-nav.
- Zero perda de favoritos entre sessões (persistência local + sync).
- Grupos por fonte e por tema visíveis sem scroll no mobile.

**Falhas a evitar**
- Confirmação modal ao favoritar.
- Favoritos sem grupos (lista plana crescente).
- Perder favoritos ao trocar de dispositivo sem login (avisar honestamente).

---

## J6 — Continuação de leitura (D, E)

**Objetivo:** retomar exatamente onde parou, sem lembrar onde estava.
**Gatilho:** abertura recorrente do app.

**Passos**
0. Abre app → **Átrio**.
1. Vê seção **"Retomar"** com as 3 últimas sessões (Bíblia Jo 15:12, CIC §1234, Jornada dia 4/14).
2. Toca uma → leitor abre no mesmo parágrafo, com scroll posicionado.
3. Alternativa: qualquer tela do app tem, no header, ícone ↩ com o último item aberto.

**Telas:** Átrio → seção Retomar → Leitor no ponto exato.

**Critério de sucesso**
- Scroll restaurado com precisão ≥95%.
- Continuidade visível sem cadastro (usa storage local); sync se logado.
- ≥50% das aberturas de usuários recorrentes usam Retomar em vez de navegar.

**Falhas a evitar**
- "Retomar" mostrar item aleatório em vez do último real.
- Reabrir sempre no topo da página em vez do parágrafo.
- Depender de rede para saber onde parou.

---

## Matriz jornadas × arquétipos

| Jornada | P | D | E |
|---|---|---|---|
| J1 Primeiro acesso | ●●● | – | – |
| J2 Primeiro estudo | ●○○ | ●●○ | ●●● |
| J3 Primeira oração | ●○○ | ●●● | ●○○ |
| J4 Pesquisa | ●○○ | ●●○ | ●●● |
| J5 Favoritos | ●○○ | ●●○ | ●●● |
| J6 Continuação | ●○○ | ●●● | ●●● |

●●● crítica · ●●○ importante · ●○○ eventual · – não se aplica

---

## Critério transversal (aplica-se a todas)

- **Nenhuma jornada** ultrapassa 4 passos até o valor entregue.
- **Nenhuma jornada** exige login antes do valor entregue.
- **Nenhuma jornada** é interrompida por promoção, upgrade ou pedido de avaliação.
- **Toda jornada** funciona no viewport 360×640.
- **Toda jornada** funciona com teclado apenas.
- **Toda jornada** tem estado offline degradado, não quebrado.
