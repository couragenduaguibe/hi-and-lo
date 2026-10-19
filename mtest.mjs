import { chromium } from 'playwright-core';
const url = process.env.URL || 'http://localhost:8765/index.html';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [name, vp] of [['p', { width: 390, height: 844 }], ['l', { width: 844, height: 390 }], ['d', { width: 1280, height: 800 }]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: name === 'd' ? 1 : 3, isMobile: name !== 'd', hasTouch: name !== 'd' }), p = await ctx.newPage(); p.setDefaultTimeout(0);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready'); await p.waitForTimeout(1800);
  await p.screenshot({ path: `out/stills/m-${name}-0.png` });
  if (name !== 'd') {
    const m = await p.evaluate(() => window.debugPos('mascot')); await p.touchscreen.tap(m[0], m[1]); await p.waitForTimeout(700); await p.screenshot({ path: `out/stills/m-${name}-1.png` });
    await p.tap('#view'); await p.waitForTimeout(1300); const v = await p.textContent('#view');
    await p.tap('#tune'); await p.waitForTimeout(300); await p.screenshot({ path: `out/stills/m-${name}-2.png` }); await p.tap('#tune');
    await p.tap('#help'); await p.waitForTimeout(200); await p.screenshot({ path: `out/stills/m-${name}-3.png` });
    console.log(name, 'view btn:', v, 'state', JSON.stringify(await p.evaluate(() => { const s = window.debugState(); return { idx: s.idx, labels: s.labels }; })), 'errors', errs.length, errs[0] || '');
  } else console.log(name, 'errors', errs.length);
  await ctx.close();
}
await b.close();
