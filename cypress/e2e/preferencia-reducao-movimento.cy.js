describe('Preferência de redução de movimento', () => {
  beforeEach(() => {
    // Acessar a página antes de cada teste
    cy.visit('/');
  });

  const abrirPainelAcessibilidade = () => {
    // Abre o menu lateral no mobile (ou o menu principal)
    cy.get('[data-testid="menu-trigger"]').click();
    // Clica no botão de Acessibilidade
    cy.get('[data-testid="a11y-trigger"]').click();
  };

  it('persiste após recarregar a página', () => {
    abrirPainelAcessibilidade();

    // Ativar a preferência de redução de movimento
    // No Switch do Radix UI, o input real é escondido, mas podemos testar o estado
    cy.get('[data-testid="reducao-movimento-toggle"]').click();
    
    // Verifica se a classe foi aplicada ao HTML
    cy.get('html').should('have.class', 'reduce-animations');

    // Recarregar a página
    cy.reload();

    // Abrir novamente o painel para verificar
    abrirPainelAcessibilidade();

    // Verificar se a preferência está ativada após recarregar
    // O Switch do Radix UI usa aria-checked
    cy.get('[data-testid="reducao-movimento-toggle"]').should('have.attr', 'aria-checked', 'true');
    cy.get('html').should('have.class', 'reduce-animations');
  });

  it('mantém o comportamento ao abrir e fechar seções', () => {
    abrirPainelAcessibilidade();
    cy.get('[data-testid="reducao-movimento-toggle"]').click();
    
    // Fecha o painel e o menu
    cy.get('body').click(0, 0); 
    cy.wait(500);
    cy.get('body').click(0, 0);

    // Navegar para o Catecismo
    cy.get('[data-testid="nav-catechism"]').click();
    
    // Entrar em uma parte para ver as seções
    cy.contains('Prólogo').click();

    // Abrir uma seção
    cy.get('[data-testid="secao-1"]').click();

    // Verificar se a seção está aberta (conteúdo visível)
    cy.get('[data-testid="secao-1-conteudo"]').should('be.visible');

    // Verificar que as animações estão desativadas (CSS check)
    cy.get('[data-testid="secao-1-conteudo"]').should('have.css', 'transition-duration', '0s');

    // Voltar para o sumário (fechar a seção)
    cy.contains('Sumário').click();

    // Verificar se a seção está "fechada" (voltamos para o modo de seções)
    cy.get('[data-testid="secao-1-conteudo"]').should('not.exist');
    cy.get('[data-testid="secao-1"]').should('be.visible');

    // Recarregar a página e verificar se a preferência persiste
    cy.reload();
    cy.get('html').should('have.class', 'reduce-animations');
  });
});
