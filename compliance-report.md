### ⚠️ Erro de Validação: `compliance-config.yml`

A configuração de thresholds contém erros que bloqueiam o build. Corrija-os para prosseguir:

#### 📍 Propriedade: `compliance_thresholds.overall`
##### ❌ Erro na Linha 2, Coluna 3
- **Problema:** O valor máximo é 100
- **Valor recebido:** `150`

```yaml
2 |   overall: 150
      ^
```

---
#### 📍 Propriedade: `compliance_thresholds.metrics.layout`
##### ❌ Erro na Linha 4, Coluna 5
- **Problema:** Deve ser um número
- **Valor recebido:** `'invalid'`
- **Esperado:** `number`

```yaml
4 |     layout: 'invalid'
        ^
```

---
