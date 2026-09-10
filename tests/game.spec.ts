import {finishRide} from './ride-helper';
import { test, expect, type Page } from '@playwright/test';
import { fresh as newRun, parseBank, SAVE_KEY, type State } from '../src/engine';
const fresh = (insight = 0) => { const s = newRun(insight); s.cash = 45000 + insight * 5000; return s; };
async function start(page: Page, state: State = fresh()) {
  state.story.intro = 4; state.story.guide = 3; state.story.view = 'game';
  if (state) await page.addInitScript(({ key, value }) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem(key, value); sessionStorage.setItem('seeded', 'yes'); } }, { key: SAVE_KEY, value: JSON.stringify(state) });
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
}
async function tab(page: Page, name: string) {
  if (page.viewportSize()!.width <= 760) await page.locator(`[data-tab="${name}"]`).click();
  else if(name==='workshop')await page.locator('#turbo-indicator').click();
  else if(name==='machine' && await page.locator('body').getAttribute('data-panel')==='workshop'){await page.locator('#back-room').click();await page.locator('.phone-object').click();await page.locator('[data-story=judol]').click();}
}
async function saved(page: Page): Promise<State> {
  const raw = await page.evaluate(key => localStorage.getItem(key), SAVE_KEY);
  const bank = parseBank(raw);
  const active = bank?.slots[bank.activeSlot];
  if (!active) throw new Error('expected an active save slot');
  return active;
}

test('renders assets, runs a spin, persists its outcome and has no viewport overflow', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await start(page); await expect(page.locator('canvas')).toHaveCount(1);
  await page.locator('#spin').click(); await expect(page.locator('#spin-label')).toHaveText('PUTAR');
  const s = await saved(page); expect(s.spins).toBe(1); expect(s.cash).toBe(45000 - 1000 + s.totalWon);
  await page.reload(); await expect(page.locator('#loading')).toBeHidden();
  expect((await saved(page)).grid).toEqual(s.grid); expect((await saved(page)).cash).toBe(s.cash);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
test('upgrade purchase unlocks exactly one held reel for one paid respin', async ({ page }) => {
  const initial=fresh();initial.upgrades.payout=1;await start(page,initial); await tab(page, 'workshop'); await page.locator('[data-upgrade="hold"]').click();
  expect((await saved(page)).cash).toBe(33000); await tab(page, 'machine');
  await page.locator('#spin').click(); await expect(page.locator('#hold-1')).toBeEnabled();
  const first = await saved(page); await page.locator('#hold-1').click();
  await expect(page.locator('#hold-1')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#spin').click(); await expect(page.locator('#spin-label')).toHaveText('PUTAR');
  const second = await saved(page); expect(second.grid[1]).toEqual(first.grid[1]); expect(second.spins).toBe(2);
  await expect(page.locator('#hold-1')).toBeDisabled();
});
test('auto-spin stops when the day runs out; sleep restores time without restarting auto',async({page})=>{
 const s=fresh();s.minutes=580;s.upgrades.auto=1;s.upgrades.turbo=2;
 await start(page,s);await page.locator('#auto').click();await expect(page.locator('#modal-body')).toContainText('Waktunya sudah habis');
 const before=await saved(page);expect(before.spins).toBe(1);expect(before.minutes).toBe(600);await expect(page.locator('#auto-label')).toHaveText('MATI');
 await page.locator('[data-action=end-day]').click();expect((await saved(page)).day).toBe(2);expect((await saved(page)).minutes).toBe(0);
 await page.waitForTimeout(1000);expect((await saved(page)).spins).toBe(1);
});

test('Sultan unlock and mode switching update the real spin cost', async ({ page }) => {
  const s = fresh(); s.spins = 30; s.upgrades.hold=1;
  await start(page, s); await page.locator('#sultan-tab').click(); await page.locator('[data-action="unlock"]').click();
  await expect(page.locator('#machine-name')).toHaveText('SULTAN MALAM');
  await expect(page.locator('#spin-cost')).toContainText('Rp3.000');
  expect((await saved(page)).cash).toBe(27000);
  await page.locator('#bet-up').click(); await expect(page.locator('#spin-cost')).toContainText('Rp6.000');
  await page.locator('#receh-tab').click(); await expect(page.locator('#spin-cost')).toContainText('Rp2.000');
});
test('prestige requires a review, preserves insight, and resets the run', async ({ page }) => {
  const s = fresh(2); s.spins = 80; s.sultanUnlocked = true;
  await start(page, s); await tab(page, 'workshop'); await page.locator('#prestige').click();
  await expect(page.locator('#modal')).toBeVisible(); expect((await saved(page)).spins).toBe(80);
  await page.locator('[data-action="rebirth"]').click();
  const n = await saved(page); expect(n.insight).toBe(5); expect(n.spins).toBe(0); expect(n.cash).toBe(25000); expect(n.debt).toBe(75000);
  await expect(page.locator('.room-stage')).toBeVisible();
});
test('unpayable exhausted kos day ends the run and refresh keeps the ending',async({page})=>{
 const s=fresh();s.day=3;s.bill=4000;s.cash=500;s.minutes=600;
 await start(page,s);await expect(page.locator('[data-action=work]')).toHaveCount(0);await page.locator('[data-action=end-day]').click();
 await expect(page.locator('#modal-body')).toContainText('Cicilan kos tidak terbayar');await page.reload();await expect(page.locator('#modal-body')).toContainText('Cicilan kos tidak terbayar');
 await page.locator('[data-action=rebirth]').click();expect((await saved(page)).day).toBe(1);expect((await saved(page)).ended).toBe(false);
});

test('help and odds controls are functional and reduced motion still resolves a spin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await start(page);
  await page.locator('#help').click(); await expect(page.locator('#modal-body')).toContainText('CARA BERMAIN');
  await page.locator('[data-action="close"]').click(); await tab(page, 'notes');
  await page.locator('#odds').click(); await expect(page.locator('.odds-table tbody tr')).toHaveCount(6);
  await page.locator('#close-modal').click(); await tab(page, 'machine');
  await page.locator('#spin').click(); await expect(page.locator('#spin-label')).toHaveText('PUTAR'); expect((await saved(page)).spins).toBe(1);
});

test('zero-cash rider pays once, reserves two hours, resumes its saved road',async({page})=>{
 await start(page,newRun());await page.locator('[data-action=work]').click();await page.locator('[data-action=start-job]').click();
 const before=await saved(page);expect(before.minutes).toBe(120);expect(before.cash).toBe(0);
 await page.locator('[data-lane="0"]').click();await page.reload();expect((await saved(page)).job?.rows).toEqual(before.job?.rows);expect((await saved(page)).job?.lane).toBe(0);
 await finishRide(page);const after=await saved(page);expect(after.cash).toBeGreaterThanOrEqual(1000);expect(after.minutes).toBe(120);expect(after.deliveries).toBe(1);
 await page.reload();expect((await saved(page)).cash).toBe(after.cash);
});

test('rider keyboard and touch controls change lanes; completing work preserves upgrades',async({page})=>{
 const s=fresh();s.cash=0;s.spins=52;s.upgrades.hold=1;s.sultanUnlocked=true;
 await start(page,s);await page.locator('[data-action=work]').click();await page.locator('[data-action=start-job]').click();
 await page.keyboard.press('ArrowLeft');expect((await saved(page)).job?.lane).toBe(0);
 await page.locator('[data-lane="2"]').click();expect((await saved(page)).job?.lane).toBe(2);
 await finishRide(page);expect((await saved(page)).sultanUnlocked).toBe(true);expect((await saved(page)).upgrades.hold).toBe(1);
});

test('loan offer shows interest before acceptance, then permits exact partial repayment', async ({ page }) => {
  await start(page); await page.locator('#pinjol').click(); await page.locator('[data-action="offer"][data-amount="10000"]').click();
  await expect(page.locator('#modal-body')).toContainText('Rp12.000'); expect((await saved(page)).loan).toBeNull();
  await page.locator('[data-action="borrow"]').click(); const s=await saved(page);
  expect(s.cash).toBe(55000);expect(s.loan?.balance).toBe(12000);expect(s.loan?.due).toBe(4);
  await page.locator('#pinjol').click(); await page.locator('[data-action="repay"][data-amount="5000"]').click();
  expect((await saved(page)).loan?.balance).toBe(7000);expect((await saved(page)).loan?.due).toBe(4);
  await page.locator('[data-action="repay"][data-amount="7000"]').click();expect((await saved(page)).loan).toBeNull();
});
test('due-day work is bounded by remaining time and a shortfall ends in repossession',async({page})=>{
 const s=fresh();s.debt=0;s.day=4;s.minutes=600;s.cash=0;s.loan={principal:10000,interest:2000,balance:12000,due:4,nextLate:4,lateCount:0,fees:0};
 await start(page,s);await expect(page.locator('#spin')).toBeDisabled();await expect(page.locator('#ojol')).toBeDisabled();
 await expect(page.locator('#modal-body')).toContainText('run berakhir');await page.locator('[data-action=end-day]').click();
 await expect(page.locator('#modal-body')).toContainText('Motor ditarik');expect((await saved(page)).ended).toBe(true);
 await page.reload();await expect(page.locator('#modal-body')).toContainText('Motor ditarik');
});

test('cascade machine visibly resolves three multiplier stages with no hold', async ({ page }) => {
  const s=fresh();s.spins=60;s.turns=60;s.cascadeUnlocked=true;
  await page.addInitScript(()=>{Math.random=()=>0;});await start(page,s);
  await page.locator('#cascade-tab').click();await expect(page.locator('#machine-name')).toHaveText('RANTAI REJEKI');
  await expect(page.locator('#hold-0')).not.toBeVisible();await expect(page.locator('#spin-cost')).toContainText('Rp3.450');
  await page.locator('#spin').click();await expect(page.locator('#result')).toContainText('RANTAI 1×');
  await expect(page.locator('#spin-label')).toHaveText('PUTAR');
  await expect(page.locator('#result')).toContainText('RANTAI 3 TAHAP');expect((await saved(page)).totalWon).toBe(94500);
});
test('day review pays a due loan automatically and a time upgrade extends the visible budget',async({page})=>{
 const s=fresh();s.debt=0;s.day=4;s.loan={principal:10000,interest:2000,balance:12000,due:4,nextLate:4,lateCount:0,fees:0};
 await start(page,s);await page.locator('[data-action=day]').last().click();await page.locator('[data-action=end-day]').click();
 expect((await saved(page)).loan).toBeNull();expect((await saved(page)).cash).toBe(33000);
 await page.locator('.phone-object').click();await page.locator('[data-story=shop]').click();await page.locator('.smartphone [data-upgrade=stamina]').click();
 expect((await saved(page)).upgrades.stamina).toBe(1);await expect(page.locator('#day-dashboard')).toContainText('11j 0m');
});

test('visible machine has no bonus sabar or pity meter',async({page})=>{
 await start(page);await expect(page.locator('.charge-panel')).toHaveCount(0);expect(await page.locator('body').innerText()).not.toMatch(/bonus sabar|pity/i);
});

test('rider pause freezes progress and a completed checkpoint survives refresh',async({page})=>{
 await start(page,newRun());await page.locator('[data-action=work]').click();await page.locator('[data-action=start-job]').click();
 await page.clock.install();await page.locator('#ride-go').click();await page.clock.runFor(3300);
 expect((await saved(page)).job?.step).toBe(1);expect((await saved(page)).job?.orders).toBe(1);
 await page.locator('#ride-pause').click();await page.clock.runFor(4000);expect((await saved(page)).job?.step).toBe(1);
 await page.reload();await expect(page.locator('#ride-overlay')).toBeVisible();expect((await saved(page)).job?.step).toBe(1);expect((await saved(page)).minutes).toBe(120);
});

test('road taps select a lane and pause exposes the correct action',async({page,isMobile})=>{
 await start(page,newRun());await page.locator('[data-action=work]').click();await page.locator('[data-action=start-job]').click();
 await expect(page.locator('#ride-pause')).toHaveAttribute('aria-label','Lanjut perjalanan');
 await page.locator('#ride-go').click();const box=(await page.locator('#road').boundingBox())!;
 if(isMobile)await page.touchscreen.tap(box.x+box.width*.75,box.y+box.height*.6);
 else await page.mouse.click(box.x+box.width*.75,box.y+box.height*.6);
 expect((await saved(page)).job?.lane).toBe(2);
 await page.locator('#ride-pause').click();await expect(page.locator('#ride-overlay')).toBeVisible();
 await expect(page.locator('#ride-pause')).toHaveAttribute('aria-label','Lanjut perjalanan');
});
