### ⚠️ Erro de Validação: `compliance-config.yml`

A configuração de thresholds contém erros que bloqueiam o build. Corrija-os para prosseguir:

#### 📍 Campo: `compliance_thresholds → overall` (Linha 1)
- **Erro:** O valor máximo é 100
- **Valor recebido:** `{ overall`

```yaml
1: compliance_thresholds: { overall: 150 }
```

