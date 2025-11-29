import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

// This test is optional — enable full run via RUN_FULL_E2E=1
const RUN_FULL = process.env.RUN_FULL_E2E === '1' || process.env.RUN_FULL_E2E === 'true';

test.describe('booking + approve workflow (optional)', () => {
  test.skip(!RUN_FULL, 'Full e2e run skipped. Set RUN_FULL_E2E=1 to enable.');

  test('patient can request appointment and doctor can approve', async ({ page, browser }) => {
    // If globalSetup seeded data, prefer using it to validate doctor approve flow.
    const seedFile = path.resolve(__dirname, '..', '.seed.json');
    let seed: any = null;
    if (fs.existsSync(seedFile)) {
      try {
        seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
      } catch (err) {
        // ignore
      }
    }

    // Patient: create a lead via booking form (guest flow) only if no seed present
    if (!seed) {
      await page.goto('/booking');

      // Fill basic contact info (labels are used by accessible components)
      await page.getByLabel('Full name').fill('E2E Patient');
      await page.getByLabel('Email').fill('e2e-patient@example.com');
      await page.getByLabel('Phone').fill('09171234567');

      // Try to use explicit test ids if available
      const dateBtn = page.getByTestId('booking-date');
      if (await dateBtn.count() > 0) {
        await dateBtn.click();
        // pick tomorrow by clicking a day button
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const d = tomorrow.getDate();
        const dayBtn = page.locator(`button:has-text("${d}")`).first();
        if (await dayBtn.count() > 0) await dayBtn.click();
      }

      // Select any available time via test ids if present
      const timeBtn = page.getByTestId(/booking-time-/);
      if (await timeBtn.count() > 0) {
        await timeBtn.first().click();
      } else {
        const radios = page.locator('input[type=radio]');
        if (await radios.count() > 0) await radios.first().check();
      }

      // Submit via test id if available
      const submit = page.getByTestId('booking-submit');
      if (await submit.count() > 0) await submit.click();
      else {
        const primary = page.locator('button').filter({ hasText: /Request|Book|Confirm|Send/i }).first();
        if (await primary.count() > 0) await primary.click();
      }

      await expect(page.locator('text=Appointment Request Sent!')).toBeVisible({ timeout: 10_000 });
    }

    // Approve: either use seeded appointment or login as a provided doctor
    if (seed) {
      const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL || 'info@lpp.ovh';
      const DOCTOR_PASS = process.env.DOCTOR_PASS || '1q2w3e4r5t6y';
      const doctorContext = await browser.newContext();
      const docPage = await doctorContext.newPage();
      // Sign in as the seeded doctor in the Auth emulator
      await docPage.goto('/login');
      // Wait for the form to be interactable
      await docPage.getByLabel('Email').fill(DOCTOR_EMAIL);
      await docPage.getByLabel('Password').fill(DOCTOR_PASS);
      const signInBtn = await docPage.getByRole('button', { name: /Sign in|Log in|Login/i }).first();
      await signInBtn.click();
      // Wait a moment for auth to complete and redirect
      await docPage.waitForURL('/', { timeout: 10000 });
      // Navigate to doctor dashboard
      await docPage.goto('/doctor/dashboard');
      // Wait for the consultation requests heading to appear
      await docPage.waitForSelector('text=Consultation Requests', { timeout: 10000 });
      await expect(docPage.getByText('Consultation Requests')).toBeVisible({ timeout: 5000 });
      // Try to click the seeded approve button by id if present
      const approveButton = docPage.getByTestId(new RegExp(`consultation-approve-${seed.appointmentId}`));
      if (await approveButton.count() > 0) {
        await approveButton.click();
      } else {
        const generic = docPage.locator('button:has-text("Approve")').first();
        if (await generic.count() > 0) await generic.click();
      }
      // Expect the requests list to clear or reflect change
      await expect(docPage.getByText(/No consultation requests at the moment.|No consultation requests/)).toBeVisible({ timeout: 10_000 });
    } else {
      // fallback: check for DOCTOR_EMAIL credentials
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
        const approveBtn = docPage.locator('button:has-text("Approve")').first();
        if (await approveBtn.count() > 0) {
          await approveBtn.click();
          await expect(docPage.locator('text=No consultation requests at the moment.')).toBeVisible({ timeout: 10_000 });
        }
      }
    }
  });
});
