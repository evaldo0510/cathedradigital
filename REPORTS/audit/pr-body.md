# 🔒 Atualização automática de dependências (high/critical)

Este PR foi aberto automaticamente pelo workflow `dependency-audit.yml` porque o conjunto de vulnerabilidades high/critical mudou.

## Alterações propostas
| Pacote | Sev | Instalada | Faixa vulnerável | Versão-alvo | Advisory |
|---|---|---|---|---|---|
| `tar` | **high** | 7.5.3 | <7.5.15 | `7.5.15` | [link](https://github.com/advisories/GHSA-xxxx) |

## Checklist antes de mergear
- [ ] `bun audit` sem findings high/critical
- [ ] `bun run typecheck` / `bun run build` OK
- [ ] Sem regressões visuais ou de tipos

📦 [Relatório completo do bun audit](https://example/artifacts)