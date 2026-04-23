# Checklist de Testes E2E - Jornadas e Passos

## 1. Criação de Jornadas (Admin)
- [ ] Acessar Painel Admin -> Gerenciar Jornadas.
- [ ] Clicar em "Nova Jornada".
- [ ] Preencher título, descrição, categoria e nível.
- [ ] Fazer upload de imagem (se aplicável).
- [ ] Clicar em "Salvar" e validar toast de sucesso: "Jornada criada com sucesso!".
- [ ] Validar que campos vazios obrigatórios disparam erro específico: "Título é obrigatório".

## 2. Edição de Jornadas (Admin)
- [ ] Selecionar uma jornada existente.
- [ ] Alterar campos e clicar em "Salvar".
- [ ] Validar toast: "Jornada atualizada!".
- [ ] Validar que a lista de jornadas reflete as mudanças imediatamente.

## 3. Gerenciamento de Passos (Steps)
- [ ] Dentro de uma jornada, clicar em "Adicionar Passo".
- [ ] Preencher título, conteúdo (Markdown), tipo (vídeo, texto, áudio).
- [ ] Salvar e validar toast: "Passo adicionado!".
- [ ] Editar um passo existente e validar persistência.
- [ ] Reordenar passos e validar que a ordem (sequence) é salva corretamente.
- [ ] Excluir um passo e validar toast: "Passo removido!".

## 4. Exclusão de Jornadas (Admin)
- [ ] Clicar no ícone de lixeira em uma jornada.
- [ ] Confirmar no diálogo de alerta.
- [ ] Validar toast: "Jornada excluída com sucesso!".
- [ ] Validar que a jornada sumiu da lista pública para os usuários.

## 5. Fluxo do Usuário (Mobile/Web)
- [ ] Iniciar uma jornada como usuário logado.
- [ ] Marcar passos como concluídos.
- [ ] Validar que o progresso (XP/Nível) é atualizado no perfil.
- [ ] Tentar acessar uma jornada sem estar logado (deve redirecionar para Login).
- [ ] Validar que o botão "Continuar" aparece na jornada em andamento no Dashboard.

## 6. Validação de Erros e Toasts
- [ ] Simular falha de rede ao salvar e validar toast de erro: "Erro ao salvar. Verifique sua conexão.".
- [ ] Validar que mensagens de erro da API (Supabase) são amigáveis.
- [ ] Validar que Toasts de erro são vermelhos (destructive) e de sucesso são verdes (success).
