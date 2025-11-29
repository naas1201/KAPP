import { test, expect } from '@playwright/test';

const RUN_FULL = process.env.RUN_FULL_E2E === '1' || process.env.RUN_FULL_E2E === 'true';

test.describe('booking + approve workflow (optional)', () => {
  test.skip(!RUN_FULL, 'Full e2e run skipped. Set RUN_FULL_E2E=1 to enable.');

  test('patient can request appointment and doctor can approve', async ({ page, browser }) => {
    // Patient: create a lead via booking form (guest flow)
    await page.goto('/booking');

    // Fill basic contact info (labels are used by accessible components)
    await page.getByLabel('Full name').fill('E2E Patient');
    await page.getByLabel('Email').fill('e2e-patient@example.com');
    await page.getByLabel('Phone').fill('09171234567');

    // Select a service (try to open the service select and pick the first option)
    const serviceTrigger = page.locator('button:has-text("Select a service")');
    if (await serviceTrigger.count() > 0) {
      await serviceTrigger.first().click();
      const option = page.locator('[role="option"]').first();
      if (await option.count() > 0) await option.click();
    }

    // Pick a date using the calendar popover if available
    const dateButton = page.locator('button:has-text("Pick a date")');
    if (await dateButton.count() > 0) {
      await dateButton.click();
      // pick tomorrow
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const d = tomorrow.getDate();
      const dayBtn = page.locator(`button:has-text("${d}")`).first();
      if (await dayBtn.count() > 0) await dayBtn.click();
    }

    // Select a time if available
    const timeRadio = page.locator('input[type="radio"]').first();
    if (await timeRadio.count() > 0) await timeRadio.check();

    // Submit the booking (advance to final submit)
    const submit = page.locator('button:has-text("Submit")').first();
    if (await submit.count() > 0) {
      await submit.click();
    } else {
      // fallback: click primary button on confirmation step
      const primary = page.locator('button').filter({ hasText: /Request|Book|Confirm|Send/i }).first();
      if (await primary.count() > 0) await primary.click();
    }

    // Expect confirmation UI
    await expect(page.locator('text=Appointment Request Sent!')).toBeVisible({ timeout: 10_000 });

    // If doctor credentials are provided, sign in as doctor and approve
    const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL;
    const DOCTOR_PASS = process.env.DOCTOR_PASS;
    if (DOCTOR_EMAIL && DOCTOR_PASS) {
      const doctorContext = await browser.newContext();
      const docPage = await doctorContext.newPage();
      await docPage.goto('/login');
      await docPage.getByLabel('Email').fill(DOCTOR_EMAIL);
      await docPage.getByLabel('Password').fill(DOCTOR_PASS);
      await docPage.getByRole('button', { name: /Sign in|Log in|Login/i }).click();
      await docPage.goto('/doctor/dashboard');
      await expect(docPage.locator('text=Consultation Requests')).toBeVisible();
      // Approve first request if any
      const approveBtn = docPage.locator('button:has-text("Approve")').first();
      if (await approveBtn.count() > 0) {
        await approveBtn.click();
        await expect(docPage.locator('text=No consultation requests at the moment.')).toBeVisible({ timeout: 10_000 });
      }
    }
  });
});
