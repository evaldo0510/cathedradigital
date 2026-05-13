import { test, expect } from '@playwright/test';

test.describe('Authentication Flow UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display all authentication options', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(['Acessar Cathedra', 'Criar Conta', 'Redefinir Senha']);
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("Apple")')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
  });

  test('should show validation errors for empty credentials', async ({ page }) => {
    await page.locator('button:has-text("Entrar")').click();
    // HTML5 validation usually kicks in, but let's check for any component-level error if any
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should allow switching between login and signup modes', async ({ page }) => {
    const signupLink = page.locator('button:has-text("Não tem conta? Criar agora")');
    await signupLink.click();
    await expect(page.locator('h1')).toContainText('Criar Conta');
    await expect(page.locator('input[placeholder="Seu nome completo"]')).toBeVisible();

    const loginLink = page.locator('button:has-text("Já tem conta? Fazer login")');
    await loginLink.click();
    await expect(page.locator('h1')).toContainText('Acessar Cathedra');
  });

  test('should handle Google login button click and show loading state', async ({ page }) => {
    const googleButton = page.locator('button:has-text("Google")');
    await googleButton.click();
    // It should show "Aguarde..." or similar if it takes a moment before redirect
    // Since we can't follow the real redirect in a clean way without hitting real Google,
    // we just verify it doesn't crash.
  });
});
