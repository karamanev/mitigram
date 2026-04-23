# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: invite-workflow.spec.ts >> Invite counterparties workflow >> Req 3 — re-checking a member restores them to the invitation
- Location: tests\invite-workflow.spec.ts:141:7

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for getByRole('tab', { name: 'Individuals' }) to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]: Mitigram
  - main [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: LC-2024-001
        - generic [ref=e10]: Letter of Credit · EUR 1,200,000
        - generic [ref=e11]: Active
      - button "Invite counterparties" [active] [ref=e12] [cursor=pointer]
  - dialog "Invite counterparties" [ref=e14]:
    - banner [ref=e15]:
      - heading "Invite counterparties" [level=2] [ref=e16]
      - button "Close dialog" [ref=e17] [cursor=pointer]: ×
    - generic [ref=e18]:
      - text: Failed to load the address book.
      - button "Retry" [ref=e19] [cursor=pointer]
```

# Test source

```ts
  1   | /**
  2   |  * Playwright e2e — Invite Counterparties workflow
  3   |  *
  4   |  * Covers all 5 requirements from the assignment:
  5   |  *   1. Invite individual counterparties from the address book
  6   |  *   2. Invite groups from the address book
  7   |  *   3. Exclude individual group members from the invitation
  8   |  *   4. Invite ad-hoc individuals not in the address book
  9   |  *   5. See all emails being invited before sending
  10  |  *
  11  |  * Prerequisites: `npm start` must be running from the repo root so that
  12  |  * http://localhost:4200 (Angular) and http://localhost:3000 (NestJS) are up.
  13  |  *
  14  |  * Run headlessly:  cd e2e && npm test
  15  |  * Run with browser: cd e2e && npm run test:headed
  16  |  */
  17  | 
  18  | import { test, expect, type Page } from '@playwright/test';
  19  | 
  20  | // ── helpers ─────────────────────────────────────────────────────────────────
  21  | 
  22  | async function openDialog(page: Page): Promise<void> {
  23  |   await page.goto('/');
  24  |   await page.getByRole('button', { name: 'Invite counterparties' }).click();
  25  |   // Wait until the skeleton loader disappears and the Individuals tab appears
> 26  |   await page.getByRole('tab', { name: 'Individuals' }).waitFor({ state: 'visible', timeout: 10_000 });
      |                                                        ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  27  | }
  28  | 
  29  | async function switchToGroupsTab(page: Page): Promise<void> {
  30  |   await page.getByRole('tab', { name: 'Groups' }).click();
  31  |   await page.getByRole('tab', { name: 'Groups' }).waitFor({ state: 'visible' });
  32  | }
  33  | 
  34  | // ── test suite ───────────────────────────────────────────────────────────────
  35  | 
  36  | test.describe('Invite counterparties workflow', () => {
  37  | 
  38  |   // ── Req 1: invite individual from address book ───────────────────────────
  39  | 
  40  |   test('Req 1 — add individual contact; chip appears in recipients', async ({ page }) => {
  41  |     await openDialog(page);
  42  | 
  43  |     // The Individuals tab is active by default; click Alice Schmidt
  44  |     await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();
  45  | 
  46  |     // The item should be marked as selected
  47  |     await expect(
  48  |       page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' })
  49  |     ).toHaveClass(/tab__item--selected/);
  50  | 
  51  |     // Alice's chip must appear in the Recipients panel
  52  |     await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).toBeVisible();
  53  | 
  54  |     // Footer count should now say "1 unique email"
  55  |     await expect(page.locator('.dialog__count')).toHaveText(/1 unique email/);
  56  |   });
  57  | 
  58  |   test('Req 1 — clicking the selected individual again removes them', async ({ page }) => {
  59  |     await openDialog(page);
  60  | 
  61  |     await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();
  62  |     await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).toBeVisible();
  63  | 
  64  |     // Second click removes
  65  |     await page.locator('.tab__item').filter({ hasText: 'Alice Schmidt' }).click();
  66  |     await expect(page.locator('.chip__name', { hasText: 'Alice Schmidt' })).not.toBeVisible();
  67  |     await expect(page.locator('.dialog__count')).toHaveText(/No recipients yet/);
  68  |   });
  69  | 
  70  |   test('Req 1 — address-book search filters the contact list', async ({ page }) => {
  71  |     await openDialog(page);
  72  | 
  73  |     await page.getByLabel('Search contacts').fill('alice');
  74  |     // Only Alice Schmidt should remain visible
  75  |     await expect(page.locator('.tab__item .tab__name')).toHaveCount(1);
  76  |     await expect(page.locator('.tab__item .tab__name').first()).toHaveText('Alice Schmidt');
  77  |   });
  78  | 
  79  |   // ── Req 2: invite group from address book ────────────────────────────────
  80  | 
  81  |   test('Req 2 — add a group; group card appears in recipients', async ({ page }) => {
  82  |     await openDialog(page);
  83  |     await switchToGroupsTab(page);
  84  | 
  85  |     // Click "EU Banks" in the groups tab
  86  |     await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
  87  | 
  88  |     // Group card must appear in the Recipients panel
  89  |     await expect(page.locator('.card__name', { hasText: 'EU Banks' })).toBeVisible();
  90  | 
  91  |     // The group tab item should be selected
  92  |     await expect(
  93  |       page.locator('.tab__item').filter({ hasText: 'EU Banks' })
  94  |     ).toHaveClass(/tab__item--selected/);
  95  | 
  96  |     // EU Banks has 9 members — footer should reflect that
  97  |     await expect(page.locator('.dialog__count')).toHaveText(/9 unique emails/);
  98  |   });
  99  | 
  100 |   test('Req 2 — deduplication: contacts in multiple selected groups are counted once', async ({ page }) => {
  101 |     await openDialog(page);
  102 |     await switchToGroupsTab(page);
  103 | 
  104 |     // Select EU Banks (9 members, includes Alice)
  105 |     await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
  106 |     // Select Top Tier (4 members: Alice, Hiro, Nathan, Thomas — Alice overlaps)
  107 |     await page.locator('.tab__item').filter({ hasText: 'Top Tier' }).click();
  108 | 
  109 |     // EU Banks (9) + Top Tier (4) but Alice is in both → 12 unique, not 13
  110 |     await expect(page.locator('.dialog__count')).toHaveText(/12 unique emails/);
  111 |   });
  112 | 
  113 |   // ── Req 3: exclude individual group members ──────────────────────────────
  114 | 
  115 |   test('Req 3 — exclude a group member; strikethrough + count drops', async ({ page }) => {
  116 |     await openDialog(page);
  117 |     await switchToGroupsTab(page);
  118 | 
  119 |     await page.locator('.tab__item').filter({ hasText: 'EU Banks' }).click();
  120 | 
  121 |     // Expand the EU Banks card
  122 |     await page.locator('.card__toggle').filter({ hasText: 'EU Banks' }).click();
  123 |     await expect(page.locator('.card__members')).toBeVisible();
  124 | 
  125 |     // Uncheck Bob Müller (deselect = exclude from invitation)
  126 |     const bobRow = page.locator('.card__member').filter({ hasText: 'Bob Müller' });
```