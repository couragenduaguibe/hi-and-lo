import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
const url = pathToFileURL(process.cwd() + '/index.html').href;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const cases = [
  ['phone-portrait', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ['phone-landscape', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }],
  ['tablet', { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
  ['desktop', { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 }],
];
for (const [name, opt] of cases) {
  const ctx = await b.newContext(opt), p = await ctx.newPage(); p.setDefaultTimeout(0);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  await p.waitForFunction('window.ready'); await p.evaluate('window.ready');
  await p.waitForTimeout(9000);
  const q = await p.evaluate(() => window.quality());
  // settle on a known frame for the picture
  await p.evaluate(() => { const r = window.renderAt; window.renderAt = () => r(200 / 60); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `out/stills/dev-${name}.png` });
  console.log(name, JSON.stringify(q), 'errors', errs.length, errs[0] || '');
  await ctx.close();
}
await b.close();
