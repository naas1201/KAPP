import { test, expect } from '@playwright/test';

test('doctor dashboard renders consultation requests section', async ({ page }) => {
  // This is a smoke test ensuring the new UI renders.
  await page.goto('/doctor/dashboard');
  await expect(page.locator('text=Consultation Requests')).toBeVisible();
});
