describe('AdminDashboard', () => {
  beforeEach(() => {
    // Mocking auth or sessions might be needed if /admin/dashboard is protected
    cy.visit('/admin/dashboard');
  });

  it('renderiza gráficos', () => {
    cy.get('[data-test="grafico-1"]').should('be.visible');
    cy.get('[data-test="grafico-2"]').should('be.visible');
  });

  it('renderiza listagens', () => {
    cy.get('[data-test="listagem-1"]').should('be.visible');
    // For listagem-2 we might need to click the financial tab
    cy.get('[data-test="listagem-2"]').should('exist'); 
  });

  it('renderiza estados vazios', () => {
    // We can simulate empty states by filtering or using segments that are likely empty in dev
    cy.get('button').contains('Inativo').click();
    cy.get('[data-test="estado-vazio-1"]').should('be.visible');
  });

  it('filtragem de listagens', () => {
    // Interaction with Radix Select might need specific handling if it's not a standard HTML select
    cy.get('[data-test="filtro-1"]').click();
    cy.get('[role="option"]').contains('XP').click();
    cy.get('[data-test="listagem-1"]').should('be.visible');
  });
});
