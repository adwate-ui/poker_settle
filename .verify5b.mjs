import { chromium } from 'playwright';
import path from 'path';

const shotsDir = 'C:/Users/X2/AppData/Local/Temp/claude/c--Users-X2-Side-projects-poker-settle/7e70df61-f9ec-46ca-ba8d-b2f2e5fae440/scratchpad/design-v1';
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

await p.goto(`${BASE}/players`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1000);
const firstPlayerRow = p.locator('table tbody tr').first();
await firstPlayerRow.click();
await p.waitForTimeout(2500);
await p.screenshot({ path: path.join(shotsDir, 'V02-playerdetail-mobile.png'), fullPage: true });

await browser.close();
