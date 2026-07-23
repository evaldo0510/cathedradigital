---
name: cathedra-plugin-ai
description: Plugin AI do Cathedra OS. Ativar quando a tarefa envolver Cathedra AI, Logos AI, Colloquium, RAG, MCP (Model Context Protocol), semantic_search, embeddings, recomendações, Aquinas mode, OAuthConsent, integração @lovable.dev/mcp-js, ou qualquer camada inteligente sobre conteúdo certificado.
---

# Plugin AI

Responsabilidades:
- **Cathedra AI / Logos** — camada inteligente sobre conteúdo já certificado editorialmente.
- **RAG** — Retrieval Augmented Generation sobre corpus Cathedra (Glossário, Santos, Magistério, Bíblia).
- **MCP** — servidor Model Context Protocol; ferramentas expostas (glossary, journal, semantic_search, liturgia, catecismo, magistério — 20 tools).
- **OAuth 2.1** — `OAuthConsent.tsx`, autenticação Supabase para MCP.
- **Semantic Search** — embeddings sobre conteúdo íntegro.
- **Recomendações** — sugestões contextualizadas por perfil espiritual.
- **Logos AI 3-part response** — estrutura oficial de resposta.
- **Aquinas mode** — modo doutrinal estrito.

Regras invioláveis:
- **Nunca gerar resposta baseada em conteúdo não certificado** (respeita Gate Editorial).
- Cap de 5 msgs/dia para usuários free (monetização).
- Lovable AI Gateway como default; nunca hand-roll provider calls.
- Consultar AI SDK docs antes de implementar (não guessar API).
- Tools MCP com `needsApproval` para operações que mutam dados.
- Segredos sempre via `secrets--add_secret`, nunca `VITE_*`.

Antes de agir:
1. Verificar se o conteúdo base passou pelo Gate Editorial (ICE ≥ 85).
2. Reutilizar tools MCP existentes antes de criar nova.
3. Consultar `ai-sdk-agent-patterns` para primitivos AI SDK corretos.
