import {finishRide} from './ride-helper';
import {test,expect,type Page} from '@playwright/test';
import {fresh,SAVE_KEY,type State} from '../src/engine';
async function load(page:Page,s?:State|object){
  if(s)await page.addInitScript(({s,key})=>{if(!sessionStorage.getItem('story-seeded')){localStorage.setItem(key,JSON.stringify(s));sessionStorage.setItem('story-seeded','1');}},{s,key:SAVE_KEY});
  await page.goto('/');await expect(page.locator('#story-layer')).toBeVisible();
}
async function read(page:Page):Promise<State>{return page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),SAVE_KEY);}
const candidate=()=>{const s=fresh();s.story.intro=4;s.story.guide=3;s.story.view='phone';s.spins=100;s.totalWon=150000;s.cascadeUnlocked=true;s.cash=45000;return s;};
test('opening is a resumable illustrated prologue; slots are not the first screen',async({page})=>{
 await load(page);await expect(page.locator('.comic-caption')).toContainText('Bima');await expect(page.locator('#spin')).not.toBeVisible();
 await page.locator('[data-story=next]').click();await page.reload();await expect(page.locator('.comic-caption')).toContainText('giliranmu');
 for(let i=0;i<3;i++)await page.locator('[data-story=next]').click();
 await expect(page.locator('.room-title')).toContainText('Angkat ponselmu');await expect(page.locator('.home-obligation')).toContainText('Rp75.000.000');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('guided phone, work, family message, phone app and first spin form one playable flow',async({page})=>{
 await load(page);await page.locator('[data-story=skip]').click();await page.locator('.phone-object').click();await page.locator('[data-story=work]').click();await expect(page.locator('.smartphone #phone-app [data-action=start-job]')).toBeVisible();
 await page.locator('[data-action=start-job]').click();await finishRide(page);
 await expect(page.locator('.smartphone .guide-callout')).toContainText('PESAN DARI RUMAH');expect((await read(page)).cash).toBeGreaterThanOrEqual(1000);
 await expect(page.locator('[data-story=judol]')).toBeDisabled();
 await page.locator('[data-story=messages]').click();await page.locator('[data-message=maya]').click();await expect(page.locator('.message-bubble')).toContainText('uang sekolah');
 await page.locator('.phone-cta').click();await page.locator('[data-story=judol]').click();await expect(page.locator('#first-spin-tip')).toBeVisible();
 await page.locator('#spin').click();await expect(page.locator('#spin-label')).toHaveText('PUTAR');expect((await read(page)).story.guide).toBe(3);
 if(await page.locator('#modal').isVisible())await page.locator('#close-modal').click();
 await page.locator('#back-room').click();await expect(page.locator('.room-stage')).toBeVisible();
});
test('phone messages and shop work independently; room keyboard cannot spin the hidden game',async({page})=>{
 const s=fresh();s.story.intro=4;s.story.guide=3;s.cash=20000;s.spins=60;
 await load(page,s);await page.keyboard.press('Space');expect((await read(page)).spins).toBe(60);
 await page.locator('.phone-object').click();await page.locator('[data-story=messages]').click();await expect(page.locator('.message-list>button')).toHaveCount(5);
 await page.keyboard.press('Escape');await expect(page.locator('.smartphone')).not.toBeVisible();
 await page.locator('.phone-object').click();await page.locator('[data-story=shop]').click();
 await page.locator('.smartphone [data-upgrade=payout]').click();expect((await read(page)).upgrades.payout).toBe(1);
 await expect(page.locator('.smartphone .progression-tree')).toBeVisible();await page.locator('.smartphone footer [data-story=home]').click();await expect(page.locator('.phone-app-grid')).toBeVisible();
});
test('v2 migration introduces story without erasing cash or upgrades',async({page})=>{
 const s=fresh();s.cash=23456;s.upgrades.hold=1;s.spins=24;s.deliveries=1;
 await load(page,{...s,version:2});await expect(page.locator('.prologue')).toBeVisible();await page.locator('[data-story=skip]').click();
 const migrated=await read(page);expect(migrated.version).toBe(5);expect(migrated.cash).toBe(23456);expect(migrated.upgrades.hold).toBe(1);
 await page.locator('[data-story=replay]').click();await expect(page.locator('.prologue')).toBeVisible();
});
test('final ticket stays locked until its milestone and money requirements are met',async({page})=>{
 const s=candidate();s.spins=99;await load(page,s);await page.locator('[data-story=finale]').click();
 await expect(page.locator('#modal-body')).toContainText('99/100');await expect(page.locator('[data-action=begin-finale]')).toHaveCount(0);
 expect((await read(page)).story.finale).toBeNull();
});
test('bad finale locks once, survives refresh with changed randomness and ends the run',async({page})=>{
 await page.addInitScript(()=>{const draw=sessionStorage.getItem('drawn')?0:.5;Math.random=()=>draw;sessionStorage.setItem('drawn','1');});
 await load(page,candidate());await page.locator('[data-story=finale]').click();await page.locator('[data-action=begin-finale]').click();
 expect((await read(page)).story.finale?.roll).toBe(50);expect((await read(page)).cash).toBe(35000);
 await page.locator('[data-action=reveal-finale]:enabled').click();await page.reload();
 await expect(page.locator('.final-seals .revealed')).toHaveCount(1);expect((await read(page)).story.finale?.roll).toBe(50);
 for(let i=0;i<2;i++)await page.locator('[data-action=reveal-finale]:enabled').click();
 await expect(page.locator('#modal-body')).toContainText('99 DARI 100');expect((await read(page)).cash).toBe(0);expect((await read(page)).familyDebt).toBe(75000000);
 await page.locator('[data-action=rebirth]').click();await expect(page.locator('.room-stage')).toBeVisible();expect((await read(page)).story.finale).toBeNull();
});
test('rare good finale clears obligations and shows the family epilogue',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0;});await load(page,candidate());await page.locator('[data-story=finale]').click();await page.locator('[data-action=begin-finale]').click();
 for(let i=0;i<3;i++)await page.locator('[data-action=reveal-finale]:enabled').click();
 await expect(page.locator('#modal-body')).toContainText('Akhirnya, pulang.');const s=await read(page);expect(s.familyDebt).toBe(0);expect(s.debt).toBe(0);expect(s.ended).toBe(true);expect(s.cash).toBe(24960000);
 await page.reload();await expect(page.locator('#modal-body')).toContainText('Akhirnya, pulang.');
});

test('phone upgrade tree enforces parents and Ojol rewards reflect the purchased branch',async({page})=>{
 const s=fresh();s.story.intro=4;s.story.guide=3;s.cash=50000;await load(page,s);
 await page.locator('.phone-object').click();await page.locator('[data-story=shop]').click();
 const tree=page.locator('.smartphone .progression-tree');await expect(tree).toBeVisible();
 await expect(tree.locator('[data-upgrade=orders]')).toBeDisabled();await expect(tree.locator('[data-upgrade=hold]')).toBeDisabled();
 await tree.locator('[data-upgrade=fare]').click();expect((await read(page)).cash).toBe(43500);
 await expect(tree.locator('[data-upgrade=orders]')).toBeEnabled();await tree.locator('[data-upgrade=orders]').click();
 await page.locator('.smartphone footer [data-story=home]').click();await page.locator('[data-story=work]').click();
 await expect(page.locator('.smartphone #phone-app')).toContainText('Rp4.250');
 await page.locator('[data-action=start-job]').click();expect((await read(page)).job!.fare).toBe(5750);
});

test('tree branch filters preserve selection after purchase and show remaining budget',async({page})=>{
 const s=fresh();s.story.intro=4;s.story.guide=3;s.cash=15000;await load(page,s);
 await page.locator('.phone-object').click();await page.locator('[data-story=shop]').click();
 const tree=page.locator('.smartphone .progression-tree');
 await tree.locator('[data-story=tree-filter][data-branch=ojol]').click();
 await expect(tree.locator('.tree-branch.general')).toBeHidden();
 await expect(tree.locator('[data-upgrade=fare]')).toBeVisible();
 await tree.locator('[data-upgrade=fare]').click();
 await expect(tree.locator('[data-story=tree-filter][data-branch=ojol]')).toHaveAttribute('aria-pressed','true');
 await expect(tree.locator('.tree-wallet')).toContainText('Rp8.500');
 await expect(tree.locator('[data-upgrade=orders]')).toContainText('Kurang Rp1.500');
 await tree.locator('[data-story=tree-filter][data-branch=all]').click();
 await expect(tree.locator('.tree-branch.general')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
