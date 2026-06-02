describe('Catecismo - Acessibilidade e Navegação', () => {
  beforeEach(() => {
    // Simular dispositivo mobile para alguns testes se necessário, 
    // mas acessibilidade por teclado é vital em desktop/híbrido.
    cy.visit('/catechism');
  });

  it('deve permitir navegação por teclado (Tab) nos elementos principais', () => {
    // Verifica se o primeiro elemento focável após o skip link (se houver) é acessível
    cy.get('body').tab();
    
    // Verifica se o campo de busca recebe foco
    cy.get('input[placeholder*="Buscar"]').should('have.focus');
  });

  it('deve exibir foco visível nos elementos', () => {
    cy.get('input[placeholder*="Buscar"]').focus();
    // Verifica se há alguma indicação visual de foco (depende do CSS, mas testamos a aplicação da pseudo-classe)
    cy.get('input[placeholder*="Buscar"]').should('have.css', 'outline-style').and('not.eq', 'none');
  });

  it('deve abrir seções e carregar parágrafos via teclado', () => {
    // Navega até o primeiro card de parte do Catecismo
    cy.get('input[placeholder*="Buscar"]').tab();
    cy.focused().should('contain', 'Prólogo');
    cy.focused().type('{enter}');

    // Agora deve estar na visualização de seções
    cy.contains('Voltar às Partes').should('be.visible');
    
    // Navega para a primeira seção
    cy.focused().tab(); // Botão voltar
    cy.focused().tab(); // Primeira seção
    cy.focused().type('{enter}');

    // Agora deve estar na visualização de leitura
    cy.url().should('include', 'reading');
    cy.contains('§1').should('be.visible');
  });

  it('deve ter atributos ARIA corretos nos botões de controle', () => {
    // Na página inicial do Catecismo
    cy.get('input').should('have.attr', 'aria-label').or('have.attr', 'placeholder');
  });
});
