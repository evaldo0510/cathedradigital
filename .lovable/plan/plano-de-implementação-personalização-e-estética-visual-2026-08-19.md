# Plano de Implementação: Personalização e Estética Visual

Este plano visa implementar melhorias visuais, personalização de marca e integração com Instagram, mantendo a estética "Mosteiro Digital" (paper-like) e sofisticada do Cathedra.

## Ajustes Visuais e Tipografia
- Refinar botões e paleta de cores para um estilo "paper-like" premium (marfim, pergaminho, dourado Cathedra).
- Ajustar tipografia editorial para maior sofisticação.

## Integração com Instagram e Perfil Profissional
- Criar o componente `ProfessionalCard` para exibição no `AppShell` e telas principais.
- Adicionar link do Instagram e QR Code ao exportar o PDF do Passaporte da Cliente.
- Criar a página "Sobre o Passaporte" (`/sobre-passaporte`) com CTA estratégico.

## Painel de Configurações da Marca
- Implementar interface em `/admin/settings` ou `/perfil/configuracoes` para personalizar:
  - Nome profissional.
  - Marca/Logo.
  - Link do Instagram.
- Persistir essas configurações no backend (tabela `profiles` ou `site_settings`).

## Detalhes Técnicos
- **Frontend**: Utilizar os tokens de design Harmony já existentes, expandindo-os se necessário para o estilo paper-like.
- **Backend**: Garantir RLS adequado para as novas configurações de perfil.
- **PDF**: Utilizar bibliotecas existentes para geração de QR Code no PDF.

---
*Este plano foca na evolução estética e funcionalidade de personalização solicitada.*
