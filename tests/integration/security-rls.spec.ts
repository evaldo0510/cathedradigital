import { test, expect } from '@playwright/test';

test.describe('Security RLS & Moderation Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Acessar via admin (simulado ou real dependendo do ambiente)
    await page.goto('/admin/security-docs');
  });

  test('should display security documentation correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Segurança & RLS');
    await expect(page.getByText('Arquitetura de RBAC')).toBeVisible();
    await expect(page.getByText('Políticas de Segurança Ativas')).toBeVisible();
  });

  test('should verify RLS protection concepts are documented', async ({ page }) => {
    const rlsSection = page.getByText('Apenas o dono da conta pode editar seu perfil');
    await expect(rlsSection).toBeVisible();
    
    const moderationSection = page.getByText("Edições em posts existentes por usuários não-admin forçam o retorno do status para 'pending'");
    await expect(moderationSection).toBeVisible();
  });

  test('should verify audit history exists', async ({ page }) => {
    await expect(page.getByText('19/08/2026')).first().toBeVisible();
    await expect(page.getByText('CERTIFIED')).first().toBeVisible();
  });
});
