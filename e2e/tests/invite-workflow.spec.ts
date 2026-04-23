/**
 * Playwright e2e — Invite Counterparties workflow
 *
 * Covers all 5 requirements from the assignment:
 *   1. Invite individual counterparties from the address book
 *   2. Invite groups from the address book
 *   3. Exclude individual group members from the invitation
 *   4. Invite ad-hoc individuals not in the address book
 *   5. See all emails being invited before sending
 *
 * Prerequisites: `npm start` must be running from the repo root so that
 * http://localhost:4200 (Angular) and http://localhost:3000 (NestJS) are up.
 *
 * Run headlessly:  cd e2e && npm test
 * Run with browser: cd e2e && npm run test:headed
 */

import { test, expect, type Page } from '@playwright/test';

// ── helpers ─────────────────────────────────────────────────────────────────

async function openDialog(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Invite counterparties' }).click();
  // Wait until the skeleton loader disappears and the Individuals tab appears
  await page.getByRole('tab', { name: 'Individuals' }).waitFor({ state: 'visible', timeout: 10_000 });
}

async function switchToGroupsTab(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Groups' }).click();
  await page.getByRole('tab', { name: 'Groups' }).waitFor({ state: 'visible' });
}

// ── test suite ───────────────────────────────────────────────────────────────

test.describe('Invite counterparties workflow', () => {

  // ── Req 1: invite individual from address book ───────────────────────────

  test('Req 1 — add individual contact; chip appears in recipients', async ({ page }) => {
    await openDialog(page);

    // The Individuals tab is active by default; click Alice Schmidt
    await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();

    // The item should be marked as selected
    await expect(
      page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' })
    ).toHaveClass(/tab__item--selected/);

    // Alice's chip must appear in the Recipients panel
    await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).toBeVisible();

    // Footer count should now say "1 unique email"
    await expect(page.locator('.dialog__count')).toHaveText(/1 unique email/);
  });

  test('Req 1 — clicking the selected individual again removes them', async ({ page }) => {
    await openDialog(page);

    await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();
    await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).toBeVisible();

    // Second click removes
    await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();
    await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).not.toBeVisible();
    await expect(page.locator('.dialog__count')).toHaveText(/No recipients yet/);
  });

  test('Req 1 — address-book search filters the contact list', async ({ page }) => {
    await openDialog(page);

    await page.getByLabel('Search contacts').fill('alice');
    // Only Alice Schmidt should remain visible
    await expect(page.locator('.tab__item .tab__name')).toHaveCount(1);
    await expect(page.locator('.tab__item .tab__name').first()).toHaveText('Alice Schmidt');
  });

  // ── Req 2: invite group from address book ────────────────────────────────

  test('Req 2 — add a group; group card appears in recipients', async ({ page }) => {
    await openDialog(page);
    await switchToGroupsTab(page);

    // Click "EU Banks" in the groups tab
    await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();

    // Group card must appear in the Recipients panel
    await expect(page.locator('.card__name', { hasText: 'EU Banks' })).toBeVisible();

    // The group tab item should be selected
    await expect(
      page.locator('.tab__item').filter({ hasText: 'EU Banks' })
    ).toHaveClass(/tab__item--selected/);

    // EU Banks has 9 members — footer should reflect that
    await expect(page.locator('.dialog__count')).toHaveText(/9 unique emails/);
  });

  test('Req 2 — deduplication: contacts in multiple selected groups are counted once', async ({ page }) => {
    await openDialog(page);
    await switchToGroupsTab(page);

    // Select EU Banks (9 members, includes Alice)
    await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
    // Select Top Tier (4 members: Alice, Hiro, Nathan, Thomas — Alice overlaps)
    await page.locator('.tab__item').filter({ hasText: 'Top Tier' }).click();

    // EU Banks (9) + Top Tier (4) but Alice is in both → 12 unique, not 13
    await expect(page.locator('.dialog__count')).toHaveText(/12 unique emails/);
  });

  // ── Req 3: exclude individual group members ──────────────────────────────

  test('Req 3 — exclude a group member; strikethrough + count drops', async ({ page }) => {
    await openDialog(page);
    await switchToGroupsTab(page);

    await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();

    // Expand the EU Banks card
    await page.locator('.card__toggle').filter({ hasText: 'EU Banks' }).click();
    await expect(page.locator('.card__members')).toBeVisible();

    // Uncheck Bob Müller (deselect = exclude from invitation)
    const bobRow = page.locator('.card__member').filter({ hasText: 'Bob Müller' });
    await bobRow.locator('.card__checkbox').uncheck();

    // Bob's name should have the excluded style (line-through via CSS class)
    await expect(
      bobRow.locator('.card__member-name')
    ).toHaveClass(/card__member-name--excluded/);

    // Count badge in card header should drop from 9/9 to 8/9
    await expect(page.locator('.card__count')).toHaveText('8/9');

    // Footer unique-email count should also drop
    await expect(page.locator('.dialog__count')).toHaveText(/8 unique emails/);
  });

  test('Req 3 — re-checking a member restores them to the invitation', async ({ page }) => {
    await openDialog(page);
    await switchToGroupsTab(page);

    await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
    await page.locator('.card__toggle').filter({ hasText: 'EU Banks' }).click();

    const bobRow = page.locator('.card__member').filter({ hasText: 'Bob Müller' });
    await bobRow.locator('.card__checkbox').uncheck();
    await expect(page.locator('.card__count')).toHaveText('8/9');

    // Re-check restores
    await bobRow.locator('.card__checkbox').check();
    await expect(page.locator('.card__count')).toHaveText('9/9');
    await expect(bobRow.locator('.card__member-name')).not.toHaveClass(/card__member-name--excluded/);
  });

  // ── Req 4: ad-hoc email ──────────────────────────────────────────────────

  test('Req 4 — type ad-hoc email and press Enter; dashed chip appears', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').fill('stranger@example.com');
    await page.locator('#adhoc-input').press('Enter');

    // Ad-hoc chip must appear (it uses chip__label, not chip__name)
    await expect(page.locator('.chip__label', { hasText: 'stranger@example.com' })).toBeVisible();

    // Footer count
    await expect(page.locator('.dialog__count')).toHaveText(/1 unique email/);
  });

  test('Req 4 — comma and semicolon also commit the email', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').fill('comma@example.com');
    await page.locator('#adhoc-input').press(',');
    await expect(page.locator('.chip__label', { hasText: 'comma@example.com' })).toBeVisible();

    await page.locator('#adhoc-input').fill('semi@example.com');
    await page.locator('#adhoc-input').press(';');
    await expect(page.locator('.chip__label', { hasText: 'semi@example.com' })).toBeVisible();

    await expect(page.locator('.dialog__count')).toHaveText(/2 unique emails/);
  });

  test('Req 4 — invalid email shows validation error, does not add chip', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').fill('not-an-email');
    await page.locator('#adhoc-input').press('Enter');

    await expect(page.locator('.zone__error')).toBeVisible();
    await expect(page.locator('.dialog__count')).toHaveText(/No recipients yet/);
  });

  test('Req 4 — duplicate ad-hoc email is silently deduped', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').fill('dup@example.com');
    await page.locator('#adhoc-input').press('Enter');
    await page.locator('#adhoc-input').fill('dup@example.com');
    await page.locator('#adhoc-input').press('Enter');

    // Only one chip and one unique email
    await expect(page.locator('.chip__label', { hasText: 'dup@example.com' })).toHaveCount(1);
    await expect(page.locator('.dialog__count')).toHaveText(/1 unique email/);
  });

  test('Req 4 — paste a comma-separated list adds all valid emails at once', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').focus();
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.setData('text/plain', 'alpha@example.com, beta@example.com, gamma@example.com');
      document.getElementById('adhoc-input')!.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }),
      );
    });

    await expect(page.locator('.chip__label', { hasText: 'alpha@example.com' })).toBeVisible();
    await expect(page.locator('.chip__label', { hasText: 'beta@example.com' })).toBeVisible();
    await expect(page.locator('.chip__label', { hasText: 'gamma@example.com' })).toBeVisible();
    await expect(page.locator('.dialog__count')).toHaveText(/3 unique emails/);
  });

  // ── Req 5: review panel shows all emails before sending ──────────────────

  test('Req 5 — review panel lists all final deduplicated emails with source hints', async ({ page }) => {
    await openDialog(page);

    // Add one individual
    await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();

    // Add one ad-hoc email
    await page.locator('#adhoc-input').fill('external@partner.com');
    await page.locator('#adhoc-input').press('Enter');

    // Add a group (Asian Banks — none overlap with Alice)
    await switchToGroupsTab(page);
    await page.locator('.tab__item').filter({ hasText: 'Asian Banks' }).click();

    // Footer must say "6 unique emails" (Alice + 4 Asian Banks + 1 ad-hoc)
    await expect(page.locator('.dialog__count')).toHaveText(/6 unique emails/);

    // Open the review panel
    await page.getByRole('button', { name: 'Send invitations' }).click();
    await expect(page.locator('.review__title')).toBeVisible();
    await expect(page.locator('.review__title')).toHaveText('Review invitation');

    // Subtitle should state the count
    await expect(page.locator('.review__subtitle')).toHaveText(/6 unique emails/);

    // Alice is listed with a hint about being an individual
    const aliceRow = page.locator('.review__item').filter({ hasText: 'alice.schmidt@deutsche-bank.example-bank.com' });
    await expect(aliceRow).toBeVisible();
    await expect(aliceRow.locator('.review__hint')).toContainText('individual');

    // The ad-hoc email is listed with "ad-hoc" hint
    const adHocRow = page.locator('.review__item').filter({ hasText: 'external@partner.com' });
    await expect(adHocRow).toBeVisible();
    await expect(adHocRow.locator('.review__hint')).toContainText('ad-hoc');

    // A group member is listed with a group hint
    const hiroRow = page.locator('.review__item').filter({ hasText: 'h.tanaka@mizuho.example-bank.com' });
    await expect(hiroRow).toBeVisible();
    await expect(hiroRow.locator('.review__hint')).toContainText('Asian Banks');
  });

  test('Req 5 — excluded member does not appear in the review list', async ({ page }) => {
    await openDialog(page);
    await switchToGroupsTab(page);

    await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
    await page.locator('.card__toggle').filter({ hasText: 'EU Banks' }).click();

    // Exclude Bob Müller
    const bobRow = page.locator('.card__member').filter({ hasText: 'Bob Müller' });
    await bobRow.locator('.card__checkbox').uncheck();

    await page.getByRole('button', { name: 'Send invitations' }).click();

    // Bob's email should not appear in the review list
    const bobEmail = 'bob.mueller@commerzbank.example-bank.com';
    await expect(page.locator('.review__item').filter({ hasText: bobEmail })).not.toBeVisible();

    // But other EU Banks members should be present (e.g. Alice)
    await expect(
      page.locator('.review__item').filter({ hasText: 'alice.schmidt@deutsche-bank.example-bank.com' })
    ).toBeVisible();
  });

  test('Req 5 — confirm & send posts to the API and shows success state', async ({ page }) => {
    await openDialog(page);

    // Add a single ad-hoc email so Send is enabled
    await page.locator('#adhoc-input').fill('test@send.example.com');
    await page.locator('#adhoc-input').press('Enter');

    await page.getByRole('button', { name: 'Send invitations' }).click();
    await expect(page.locator('.review__title')).toBeVisible();

    await page.getByRole('button', { name: 'Confirm & send' }).click();

    // Success state
    await expect(page.locator('.review__success')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.review__success')).toContainText('Invitations sent successfully');
  });

  // ── UX polish / miscellaneous ─────────────────────────────────────────────

  test('dialog closes on Escape key', async ({ page }) => {
    await openDialog(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('dialog closes when clicking the × button', async ({ page }) => {
    await openDialog(page);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('Send invitations button is disabled with no recipients', async ({ page }) => {
    await openDialog(page);
    await expect(
      page.getByRole('button', { name: 'Send invitations' })
    ).toBeDisabled();
  });

  test('Back button in review panel returns to the main dialog', async ({ page }) => {
    await openDialog(page);

    await page.locator('#adhoc-input').fill('back@test.com');
    await page.locator('#adhoc-input').press('Enter');

    await page.getByRole('button', { name: 'Send invitations' }).click();
    await expect(page.locator('.review__title')).toBeVisible();

    await page.getByRole('button', { name: 'Back' }).first().click();
    // Should be back on the main dialog with the input visible
    await expect(page.locator('#adhoc-input')).toBeVisible();
  });
});
