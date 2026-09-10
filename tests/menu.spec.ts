import { test, expect, type Page } from '@playwright/test';
import { fresh, parseBank, SAVE_KEY, type SaveBank, type State } from '../src/engine';

const money = (n: number) => 'Rp' + Math.round(n).toLocaleString('id-ID');

async function seed(page: Page, bank: SaveBank | State) {
  await page.addInitScript(({ key, value }) => {
    if (!sessionStorage.getItem('menu-seeded')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('menu-seeded', '1');
    }
  }, { key: SAVE_KEY, value: JSON.stringify(bank) });
}

async function readBank(page: Page): Promise<SaveBank> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  const bank = parseBank(raw);
  if (!bank) throw new Error('expected a save bank');
  return bank;
}

function filled(cash: number, day = 2): State {
  const state = fresh();
  state.cash = cash;
  state.day = day;
  state.story.intro = 4;
  state.story.guide = 3;
  state.story.view = 'room';
  return state;
}

test('cold title shows Mulai, disabled Lanjut, Muat, and Opsi', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#menu-start')).toBeVisible();
  await expect(page.locator('#menu-continue')).toBeDisabled();
  await expect(page.locator('#menu-load')).toBeVisible();
  await expect(page.locator('#menu-options')).toBeVisible();
  await expect(page.locator('.comic-caption')).toHaveCount(0);
});

test('Mulai on empty storage reaches prologue panel 01', async ({ page }) => {
  await page.goto('/');
  await page.locator('#menu-start').click();
  await expect(page.locator('.comic-caption span')).toContainText('01 /');
  await expect(page.locator('.comic-caption')).toContainText('Bima');
});

test('Lanjut loads the last active slot', async ({ page }) => {
  const state = filled(24680, 3);
  await seed(page, state);
  await page.goto('/');
  await expect(page.locator('#menu-continue')).toBeEnabled();
  await page.locator('#menu-continue').click();
  await expect(page.locator('.world-wallet b')).toHaveText(money(24680));
  await expect(page.locator('.home-chapter b')).toContainText('Hari 03');
});

test('Muat lists three slots and loading restores each cash', async ({ page }) => {
  const bank: SaveBank = {
    version: 6,
    activeSlot: 0,
    slots: [filled(12000, 2), filled(45000, 4), null],
    settings: { muted: false, reducedMotion: false },
  };
  await seed(page, bank);
  await page.goto('/');
  await page.locator('#menu-load').click();
  await expect(page.locator('#menu-slot-0')).toContainText('Hari 2');
  await expect(page.locator('#menu-slot-0')).toContainText(money(12000));
  await expect(page.locator('#menu-slot-1')).toContainText('Hari 4');
  await expect(page.locator('#menu-slot-1')).toContainText(money(45000));
  await expect(page.locator('#menu-slot-2')).toContainText('Kosong');
  await expect(page.locator('#menu-slot-2')).toBeDisabled();
  await page.locator('#menu-slot-0').click();
  await expect(page.locator('.world-wallet b')).toHaveText(money(12000));
  await page.locator('[data-story=system]').click();
  await page.locator('#menu-title').click();
  await page.locator('#menu-load').click();
  await page.locator('#menu-slot-1').click();
  await expect(page.locator('.world-wallet b')).toHaveText(money(45000));
});

test('Mulai into filled slots asks to confirm; cancel keeps cash and confirm starts day 1', async ({ page }) => {
  const bank: SaveBank = {
    version: 6,
    activeSlot: 0,
    slots: [filled(11111, 2), filled(22222, 3), filled(33333, 5)],
    settings: { muted: false, reducedMotion: false },
  };
  await seed(page, bank);
  await page.goto('/');
  await page.locator('#menu-start').click();
  await expect(page.locator('#menu-overwrite')).toContainText(money(11111));
  await page.locator('#menu-overwrite-no').click();
  expect((await readBank(page)).slots[0]!.cash).toBe(11111);
  await page.locator('#menu-start').click();
  await page.locator('#menu-overwrite-yes').click();
  await expect(page.locator('.comic-caption span')).toContainText('01 /');
  const after = await readBank(page);
  expect(after.slots[0]!.day).toBe(1);
  expect(after.slots[0]!.cash).toBe(0);
  expect(after.slots[1]!.cash).toBe(22222);
});

test('Opsi mute and reduced motion persist across title reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#menu-options').click();
  await page.locator('#menu-mute').click();
  await page.locator('#menu-motion').click();
  await expect(page.locator('#menu-mute')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#menu-motion')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.locator('#menu-options').click();
  await expect(page.locator('#menu-mute')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#menu-motion')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => document.documentElement.dataset.reducedMotion)).toBe('true');
  const bank = await readBank(page);
  expect(bank.settings.muted).toBe(true);
  expect(bank.settings.reducedMotion).toBe(true);
  expect(bank.slots[0]).toBeNull();
});

test('system menu saves, lists load and options, and returns to title', async ({ page }) => {
  await seed(page, filled(18000, 2));
  await page.goto('/');
  await page.locator('#menu-continue').click();
  await page.locator('[data-story=system]').click();
  await expect(page.locator('#menu-save')).toBeVisible();
  await expect(page.locator('#menu-load-system')).toBeVisible();
  await expect(page.locator('#menu-options-system')).toBeVisible();
  await expect(page.locator('#menu-title')).toBeVisible();
  await page.locator('#menu-save').click();
  expect((await readBank(page)).slots[0]!.cash).toBe(18000);
  await page.locator('#menu-title').click();
  await expect(page.locator('#menu-start')).toBeVisible();
  await expect(page.locator('#menu-continue')).toBeEnabled();
  await page.locator('#menu-continue').click();
  await expect(page.locator('.world-wallet b')).toHaveText(money(18000));
});

test('Escape opens the system menu from the room unless a locked modal owns the dialog', async ({ page }) => {
  await seed(page, filled(9000, 1));
  await page.goto('/');
  await page.locator('#menu-continue').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-save')).toBeVisible();
  await page.locator('#menu-resume').click();
  await expect(page.locator('#shell-menu')).toBeHidden();
});

test('Escape over help closes the modal and keeps playing', async ({ page }) => {
  const state = filled(9000, 1);
  state.story.view = 'game';
  await seed(page, state);
  await page.goto('/');
  await page.locator('#menu-continue').click();
  await page.locator('#help').click();
  await page.keyboard.press('Escape');
  expect(await page.locator('#modal').evaluate((el: HTMLDialogElement) => el.open)).toBe(false);
  expect(await page.evaluate(() => document.body.dataset.shell)).toBe('playing');
});

test('review screenshots for title, slots, and mobile shell', async ({ page }, info) => {
  if (info.project.name === 'desktop') {
    await page.goto('/');
    await page.screenshot({ path: 'docs/review/BL-2-review-title.png' });
    const bank: SaveBank = {
      version: 6,
      activeSlot: 0,
      slots: [filled(12000, 2), filled(45000, 4), null],
      settings: { muted: false, reducedMotion: false },
    };
    const slotsPage = await page.context().newPage();
    await slotsPage.addInitScript(({ key, value }) => { localStorage.setItem(key, value); }, { key: SAVE_KEY, value: JSON.stringify(bank) });
    await slotsPage.goto('/');
    await slotsPage.locator('#menu-load').click();
    await expect(slotsPage.locator('#menu-slot-0')).toContainText(money(12000));
    await expect(slotsPage.locator('#menu-slot-1')).toContainText(money(45000));
    await slotsPage.screenshot({ path: 'docs/review/BL-2-review-slots.png' });
    await slotsPage.close();
  }
  if (info.project.name === 'mobile') {
    await page.goto('/');
    await expect(page.locator('#menu-start')).toBeVisible();
    await expect(page.locator('#menu-options')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'docs/review/BL-2-review-mobile.png' });
  }
});
