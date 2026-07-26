## 🔒 Dependency Audit

- **Critical:** 0 · **High:** 1 · **Moderate:** 0 · **Low:** 0
- [📦 Baixar relatório completo do `bun audit`](https://example/artifacts)

### ❌ High / Critical (bloqueiam o build)
| Pacote | Sev | Instalada | Faixa vulnerável | Versão-alvo | Advisory |
|---|---|---|---|---|---|
| `tar` | **high** | 7.5.3 | <7.5.15 | `7.5.15` | [link](https://github.com/advisories/GHSA-xxxx) |

**Como aplicar as correções sugeridas:**
```bash
bun add tar@7.5.15   # ou via overrides se for transitiva
```

### 📈 Diferença vs. execução anterior
_sem baseline — esta é a primeira execução registrada_

_Gerado por `scripts/audit-summary.mjs` em 2026-07-26T19:51:56.003Z_