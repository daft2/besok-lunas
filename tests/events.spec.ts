import { test, expect, type Page } from '@playwright/test';
import { borrow, fresh, parseBank, SAVE_KEY, type State } from '../src/engine';

async function continuePlay(page: Page) {
  await page.locator('#menu-continue').click();
  await expect(page.locator('#menu-continue')).toBeHidden();
  await closeBillIfOpen(page);
}
async function load(page: Page, s?: State | object) {
  if (s) await page.addInitScript(({ s, key }) => { if (!sessionStorage.getItem('story-seeded')) { localStorage.setItem(key, JSON.stringify(s)); sessionStorage.setItem('story-seeded', '1'); } }, { s, key: SAVE_KEY });
  await page.goto('/');
  if (s) await continuePlay(page);
  else await page.locator('#menu-start').click();
  await expect(page.locator('#shell-menu')).toBeHidden();
}
async function read(page: Page): Promise<State> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  const bank = parseBank(raw);
  const active = bank?.slots[bank.activeSlot];
  if (!active) throw new Error('expected an active save slot');
  return active;
}
function playable() {
  const s = fresh();
  s.story.intro = 4;
  s.story.guide = 3;
  s.cash = 25000;
  return s;
}
async function openJudol(page: Page) {
  await closeBillIfOpen(page);
  const overlay = page.locator('.event-card');
  if (await overlay.isVisible()) return;
  await page.locator('.phone-object').click();
  await page.locator('[data-story=judol]').click();
}
async function closeBillIfOpen(page: Page) {
  const modal = page.locator('#modal');
  try {
    await modal.waitFor({ state: 'visible', timeout: 1500 });
    await page.locator('#close-modal').click();
    await expect(modal).toBeHidden();
  } catch {
    return;
  }
}

test('kos bill blocks Judol with overlay copy and the reels do not pay out', async ({ page }) => {
  const s = playable();
  s.day = 2;
  s.bill = 4000;
  await load(page, s);
  const cash = (await read(page)).cash;
  await openJudol(page);
  await expect(page.locator('.event-card')).toContainText('Kos belum lunas');
  await expect(page.locator('.event-card')).toContainText('Judol menunggu');
  await expect(page.locator('.event-ack')).toBeVisible();
  await expect(page.locator('#spin')).toBeDisabled();
  expect((await read(page)).cash).toBe(cash);
  expect((await read(page)).spins).toBe(0);
  expect((await read(page)).story.pending).toEqual(['kos-bill']);
});

test('pinjol due shows block copy before gambling', async ({ page }) => {
  const s = playable();
  borrow(s, 10000);
  s.day = s.loan!.due;
  await load(page, s);
  await openJudol(page);
  await expect(page.locator('.event-card')).toContainText('Pinjol jatuh tempo');
  await expect(page.locator('.event-ack')).toBeVisible();
});

test('unread Ibu after three shifts gains a missed beat and a Pesan badge', async ({ page }) => {
  const s = playable();
  s.deliveries = 3;
  await load(page, s);
  await expect(page.locator('.event-notice')).toContainText('Ibu masih menunggu');
  await page.locator('.phone-object').click();
  await expect(page.locator('[data-story=messages] em')).toHaveText(/[1-9]/);
  await page.locator('[data-story=messages]').click();
  await expect(page.locator('[data-message=ibu] em')).toBeVisible();
  await page.locator('[data-message=ibu]').click();
  await expect(page.locator('.message-beat')).toHaveCount(2);
  await expect(page.locator('.message-bubble').nth(1)).toContainText('Ibu coba tanya lagi');
  await expect(page.locator('.message-narration').nth(1)).toContainText('belum dibuka');
});

test('three Receh wins unlock the Doni streak beat', async ({ page }) => {
  const s = playable();
  s.winStreak = 3;
  s.story.read = ['doni'];
  s.story.threads = { doni: { cursor: 0 } };
  await load(page, s);
  await page.locator('.phone-object').click();
  await page.locator('[data-story=messages]').click();
  await page.locator('[data-message=doni]').click();
  await expect(page.locator('.message-beat')).toHaveCount(2);
  await expect(page.locator('.message-bubble').nth(1)).toContainText('recehnya lagi panas');
});

test('night clock unlocks Naya’s ayah-home beat', async ({ page }) => {
  const s = playable();
  s.spins = 20;
  s.minutes = 480;
  await load(page, s);
  await page.locator('.phone-object').click();
  await page.locator('[data-story=messages]').click();
  await page.locator('[data-message=naya]').click();
  await expect(page.locator('.message-beat')).toHaveCount(2);
  await expect(page.locator('.message-bubble').nth(1)).toContainText('lampu depan');
});

test('dismissing a notify keeps the room phone unread count', async ({ page }) => {
  const s = playable();
  s.deliveries = 3;
  await load(page, s);
  await expect(page.locator('.event-notice')).toBeVisible();
  await page.locator('[data-story=dismiss-event]').click();
  await expect(page.locator('.event-notice')).toHaveCount(0);
  await expect(page.locator('.phone-object small')).toContainText(/[1-9] pesan/);
  const saved = await read(page);
  expect(saved.story.pending.includes('ibu-missed')).toBe(false);
  expect(saved.story.read.includes('ibu')).toBe(false);
});

test('reload while a kos block is pending keeps one copy', async ({ page }) => {
  const s = playable();
  s.day = 2;
  s.bill = 4000;
  await load(page, s);
  await openJudol(page);
  await expect(page.locator('.event-card')).toContainText('Kos belum lunas');
  const pending = (await read(page)).story.pending;
  expect(pending).toEqual(['kos-bill']);
  await page.reload();
  await continuePlay(page);
  await expect(page.locator('.event-card')).toContainText('Kos belum lunas');
  expect((await read(page)).story.pending).toEqual(['kos-bill']);
});

test('Kesempatan Terakhir still opens when finaleReady', async ({ page }) => {
  const s = playable();
  s.spins = 100;
  s.totalWon = 150000;
  s.cascadeUnlocked = true;
  await load(page, s);
  await page.locator('.phone-object').click();
  await page.locator('[data-story=finale]').click();
  await expect(page.locator('#modal-body')).toContainText('Kesempatan Terakhir');
  await expect(page.locator('[data-action=begin-finale]')).toBeVisible();
  await expect(page.locator('#modal-body')).not.toContainText('sabung');
  await expect(page.locator('#modal-body')).not.toContainText('sports');
});

test('review screenshots for kos block, Ibu thread, and mobile acknowledge', async ({ page }, info) => {
  if (info.project.name !== 'desktop') return;
  const block = playable();
  block.day = 2;
  block.bill = 4000;
  await load(page, block);
  await openJudol(page);
  await expect(page.locator('.event-card')).toContainText('Kos belum lunas');
  await page.screenshot({ path: 'docs/review/BL-4-review-block.png' });

  const ibu = playable();
  ibu.deliveries = 3;
  const threadPage = await page.context().newPage();
  await threadPage.addInitScript(({ s, key }) => { localStorage.setItem(key, JSON.stringify(s)); }, { s: ibu, key: SAVE_KEY });
  await threadPage.goto('/');
  await continuePlay(threadPage);
  await threadPage.locator('.phone-object').click();
  await threadPage.locator('[data-story=messages]').click();
  await threadPage.locator('[data-message=ibu]').click();
  await expect(threadPage.locator('.message-beat')).toHaveCount(2);
  await expect(threadPage.locator('.message-bubble').nth(1)).toContainText('Ibu coba tanya lagi');
  await threadPage.screenshot({ path: 'docs/review/BL-4-review-thread.png' });
  await threadPage.close();

  const mobile = playable();
  mobile.day = 2;
  mobile.bill = 4000;
  const mobilePage = await page.context().newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });
  await mobilePage.addInitScript(({ s, key }) => { localStorage.setItem(key, JSON.stringify(s)); }, { s: mobile, key: SAVE_KEY });
  await mobilePage.goto('/');
  await continuePlay(mobilePage);
  await expect(mobilePage.locator('.event-ack')).toBeVisible();
  await expect(mobilePage.locator('.event-card')).toContainText('Kos belum lunas');
  const box = await mobilePage.locator('.event-ack').boundingBox();
  expect(box).toBeTruthy();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await mobilePage.screenshot({ path: 'docs/review/BL-4-review-mobile.png' });
  await mobilePage.locator('.event-ack').click();
  await expect(mobilePage.locator('.event-card')).toHaveCount(0);
  await mobilePage.close();
});
