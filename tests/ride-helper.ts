import {expect,type Page} from '@playwright/test';
export async function finishRide(page:Page){
 await page.clock.install();
 await page.locator('#ride-go').click();
 await page.clock.runFor(27000);
 await expect(page.locator('[data-action=ride-done]')).toBeVisible();
 await page.locator('[data-action=ride-done]').click();
}
