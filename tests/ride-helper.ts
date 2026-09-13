import {expect,type Page} from '@playwright/test';
import {parseBank,SAVE_KEY,type State} from '../src/engine';

export async function loadSave(page:Page):Promise<State>{
 const raw=await page.evaluate(key=>localStorage.getItem(key),SAVE_KEY);
 const bank=parseBank(raw);
 const active=bank?.slots[bank.activeSlot];
 if(!active)throw new Error('expected an active save slot');
 return active;
}

export async function waitForJob(page:Page,pred:(job:State['job'])=>boolean,cap=40000){
 let waited=0;
 while(waited<cap){
  if(pred((await loadSave(page)).job))return;
  await page.clock.runFor(200);
  waited+=200;
 }
 throw new Error('timed out waiting for job');
}

export async function waitForRideDone(page:Page){
 for(let i=0;i<240;i++){
  if(await page.locator('[data-action=ride-done]').isVisible())return;
  await page.clock.runFor(250);
 }
 await expect(page.locator('[data-action=ride-done]')).toBeVisible();
}

export async function finishRide(page:Page){
 await page.clock.install();
 await page.locator('#ride-go').click();
 await waitForRideDone(page);
 await page.locator('[data-action=ride-done]').click();
}
