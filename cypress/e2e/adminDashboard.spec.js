describe('AdminDashboard', () => {
  beforeEach(() => {
    cy.visit('/admin/dashboard');
  });

  it('renderiza gráficos', () => {
    cy.get('[data-test="grafico-1"]').should('be.visible');
    cy.get('[data-test="grafico-2"]').should('be.visible');
  });

  it('renderiza listagens', () => {
    cy.get('[data-test="listagem-1"]').should('be.visible');
    cy.get('[data-test="listagem-2"]').should('be.visible');
  });

  it('renderiza estados vazios', () => {
    cy.get('[data-test="estado-vazio-1"]').should('be.visible');
    cy.get('[data-test="estado-vazio-2"]').should('be.visible');
  });

  it('filtragem de listagens', () => {
    cy.get('[data-test="filtro-1"]').select('Opção 1');
    cy.get('[data-test="listagem-1"]').should('contain', 'Item 1');
    cy.get('[data-test="filtro-1"]').select('Opção 2');
    cy.get('[data-test="listagem-1"]').should('contain', 'Item 2');
  });

  it('ordenacao de listagens', () => {
    cy.get('[data-test="ordenacao-1"]').select('Ordem 1');
    cy.get('[data-test="listagem-1"]').should('contain', 'Item 1');
    cy.get('[data-test="ordenacao-1"]').select('Ordem 2');
    cy.get('[data-test="listagem-1"]').should('contain', 'Item 2');
  });
});
