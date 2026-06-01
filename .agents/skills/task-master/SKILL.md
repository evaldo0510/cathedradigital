---
name: task-master
description: Orquestração de Elite com Multi-Agentes (A, B e C) operando em paralelo via Waves e Inboxes.
---

# TASK MASTER: Orquestração de Elite com Multi-Agentes

Skill de arquitetura avançada para orquestração coordenada de engenharia usando múltiplos agentes virtuais (A, B e C) operando em paralelo através de Waves e Inboxes.

## 1. Estrutura de Agentes (Divisão de Poder)
Cada agente atua como um especialista com escopo disjunto:

- **Agente A (Core)**: Lógica central, funcionalidades principais e roteamento.
- **Agente B (Ecossistema)**: Integrações, hooks, serviços e suítes de testes.
- **Agente C (Guardião)**: Segurança (RLS), performance, design system (Tailwind/CSS) e auditoria cross-cutting.

## 2. Sistema de WAVES (Ciclos de Sincronização)
O trabalho é executado em ondas:

### Wave 1: Ação
- Os agentes auditam e aplicam edições simultaneamente em seus arquivos de escopo.
- Conflitos de interesse são registrados nos Inboxes dos respectivos colegas.

### Wave 2: Drenagem (Revisão Cruzada)
- Leitura e processamento das solicitações nos Inboxes.
- Refinamento de integrações e resolução de pendências.
- Validação cruzada do código.

## 3. Comunicação via INBOX
Protocolo de comunicação assíncrona para evitar conflitos de salvamento:

- **Mensagens**: Pedidos de edição (Edit-Requests), perguntas técnicas e notificações de bloqueio.
- **Localização**: `.agents/skills/task-master/inbox/agent-{a|b|c}.md`.
- **Zero Conflito**: Nenhum agente escreve em arquivo fora de seu escopo sem aprovação via Inbox.

## Instruções de Ativação
Sempre que a TASK MASTER for ativada para uma tarefa complexa:
1. Divida a tarefa entre os Agentes A, B e C.
2. Execute a Wave 1 (batch de ferramentas em paralelo).
3. Verifique os Inboxes e execute a Wave 2.
4. Entregue o resultado final após a validação do Guardião.
