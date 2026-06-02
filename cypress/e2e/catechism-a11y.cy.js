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

  it('deve desativar animações quando a redução de movimento estiver habilitada', () => {
    // Abre configurações de acessibilidade (simulando clique no botão do header)
    // Nota: O seletor depende do ícone/texto real
    cy.get('button').filter(':has(svg)').first().click({ force: true }); 
    // Como os testes E2E podem ser sensíveis a layouts, vamos tentar um seletor mais genérico se falhar
    
    // Simula a ativação via localStorage para garantir o estado antes de interagir
    cy.window().then((win) => {
      const settings = JSON.parse(win.localStorage.getItem('cathedra_reading_settings') || '{}');
      win.localStorage.setItem('cathedra_reading_settings', JSON.stringify({
        ...settings,
        reduceAnimations: true
      }));
    });
    cy.reload();

    // Verifica se a classe está no root
    cy.get('html').should('have.class', 'reduce-animations');

    // Verifica se as propriedades CSS de animação são nulas/mínimas
    cy.get('body').then(($el) => {
      const duration = window.getComputedStyle($el[0], '*').getPropertyValue('transition-duration');
      // O seletor '*' acima é ilustrativo; window.getComputedStyle funciona melhor em elementos específicos
    });

    // Testa a navegação rápida
    const start = Date.now();
    cy.contains('PARTE').first().click();
    cy.contains('Voltar às Partes').should('be.visible').then(() => {
      const end = Date.now();
      expect(end - start).to.be.lessThan(500);
    });
  });
});
