# Guia de Configuração: Google Search Console

Para garantir que o Cathedra Digital seja indexado corretamente e para monitorar o desempenho de busca, siga os passos abaixo.

## 1. Verificação de Propriedade do Domínio

Existem duas formas principais de verificar que você é o dono do domínio `www.cathedradigital.com.br`:

### Opção A: Registro DNS (Recomendado)
1. Acesse o [Google Search Console](https://search.google.com/search-console).
2. Adicione uma nova propriedade do tipo **Domínio** (cathedradigital.com.br).
3. Copie o registro **TXT** fornecido pelo Google.
4. Adicione este registro nas configurações de DNS do seu provedor de domínio (ex: Registro.br, Cloudflare, GoDaddy).
5. Clique em **Verificar** no Search Console.

### Opção B: Arquivo HTML
1. Adicione uma nova propriedade do tipo **Prefixo de URL** (`https://www.cathedradigital.com.br/`).
2. Baixe o arquivo de verificação HTML fornecido pelo Google.
3. Peça ao Lovable para adicionar este arquivo na pasta `public/` do projeto (ou adicione você mesmo se tiver acesso ao código).
4. Clique em **Verificar**.

## 2. Envio do Sitemap

Após a verificação:
1. No menu lateral, clique em **Sitemaps**.
2. No campo "Adicionar um novo sitemap", digite: `sitemap.xml`.
3. Clique em **Enviar**.

## 3. Automação no Projeto

O projeto agora conta com geração automática do sitemap durante o build:
- O script `scripts/generate-sitemap.ts` é executado antes de cada deploy.
- Ele sincroniza as rotas públicas definidas no código com o arquivo `public/sitemap.xml`.
- Existe um teste de validação (`scripts/validate-sitemap.ts`) que garante que nenhuma rota importante foi esquecida.

## 4. Redirecionamentos 301

Rotas antigas como `/dashboard` e `/biblia` foram configuradas com redirecionamentos 301 no arquivo `public/_redirects`. Isso informa ao Google que o conteúdo mudou permanentemente de lugar, preservando o "SEO juice" das URLs antigas.
