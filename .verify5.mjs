import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const shotsDir = 'C:/Users/X2/AppData/Local/Temp/claude/c--Users-X2-Side-projects-poker-settle/7e70df61-f9ec-46ca-ba8d-b2f2e5fae440/scratchpad/design-v1';
fs.mkdirSync(shotsDir, { recursive: true });
const BASE = 'https://poker-settle.pages.dev';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const p = await ctx.newPage();
await p.goto(`${BASE}/auth`, { waitUntil: 'networkidle' });
await p.fill('#signin-email', 'adwatek2015@email.iimcal.ac.in');
await p.fill('#signin-password', 'pokeraudit2026');
await p.click('button[type="submit"]:has-text("Sign In")');
await p.waitForTimeout(2500);
const skip = p.locator('button:has-text("Skip")');
if (await skip.isVisible().catch(() => false)) { await skip.click(); await p.waitForTimeout(500); }

await p.goto(`${BASE}/games`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
await p.screenshot({ path: path.join(shotsDir, 'V01-games-mobile.png'), fullPage: true });

await p.goto(`${BASE}/players`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const firstPlayerRow = p.locator('table tbody tr').first();
if (await firstPlayerRow.isVisible().catch(() => false)) {
  await firstPlayerRow.click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(shotsDir, 'V02-playerdetail-mobile.png'), fullPage: true });
}

await p.goto(`${BASE}/games`, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const firstGameRow = p.locator('table tbody tr').first();
if (await firstGameRow.isVisible().catch(() => false)) {
  await firstGameRow.click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: path.join(shotsDir, 'V03-gamedetail-mobile.png'), fullPage: true });
}

await browser.close();
