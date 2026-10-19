import { chromium } from 'playwright-core';
const url = process.env.URL || 'http://localhost:8765/index.html';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const cam = p => p.evaluate(() => { const c = document.querySelector('canvas'); return window.debugCam(); });
async function open(opt) { const ctx = await b.newContext(opt), p = await ctx.newPage(); p.setDefaultTimeout(0); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready'); await p.waitForTimeout(1200); return { ctx, p, errs }; }
{ // desktop: hover steers, drag turns, click serves, double-click resets
  const { ctx, p, errs } = await open({ viewport: { width: 1280, height: 800 } }); const st = () => p.evaluate(() => window.debugState()), pos = n => p.evaluate(n => window.debugPos(n), n);
  console.log('  has view button:', await p.locator('#view').count());
  await p.click('[data-pick=hi]'); let c = await pos('x0'); await p.mouse.click(c[0], c[1]); await p.waitForTimeout(300); console.log('  click serves:', (await st()).state);
  let a = await pos('x2'); await p.mouse.move(a[0], a[1]); await p.waitForTimeout(350); console.log('  hover steer x', (await st()).mx);
  const c0 = await cam(p); await p.mouse.move(640, 400); await p.mouse.down(); await p.mouse.move(900, 300, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(900); const c1 = await cam(p); console.log('  drag turns view: az', c0.az, '->', c1.az, 'el', c0.el, '->', c1.el, 'state still', (await st()).state);
  await p.screenshot({ path: 'out/stills/c-desktop-turned.png' });
  a = await pos('x-2'); await p.mouse.move(a[0], a[1]); await p.waitForTimeout(350); console.log('  steer after turning: x', (await st()).mx);
  await p.mouse.wheel(0, -400); await p.waitForTimeout(600); console.log('  wheel zoom dist', c1.dist, '->', (await cam(p)).dist);
  await p.mouse.dblclick(1150, 720); await p.waitForTimeout(1200); const c2 = await cam(p); console.log('  double-click reset: az', c2.az, 'el', c2.el, 'dist', c2.dist);
  let k = await pos('top'); await p.mouse.click(k[0], k[1]); console.log('  light tap:', (await st()).lights.top, (await st()).mood);
  await p.keyboard.down('Shift'); await p.keyboard.press('ArrowLeft'); await p.keyboard.up('Shift'); await p.waitForTimeout(500); console.log('  shift+arrow az', (await cam(p)).az);
  console.log('desktop errors', errs.length, errs.slice(0, 2)); await ctx.close();
}
{ // phone: drag on the court steers, drag around it turns, two fingers turn + pinch
  const { ctx, p, errs } = await open({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const st = () => p.evaluate(() => window.debugState()), pos = n => p.evaluate(n => window.debugPos(n), n);
  const cdp = await ctx.newCDPSession(p), touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await p.tap('[data-pick=lo]'); let c = await pos('x0'); await p.touchscreen.tap(c[0], c[1]); await p.waitForTimeout(300); console.log('  tap serves:', (await st()).state, 'me', (await st()).me);
  const a = await pos('x0'), bb = await pos('x2'); const c0 = await cam(p);
  await touch('touchStart', [a]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[a[0] + (bb[0] - a[0]) * i / 6, a[1]]]); await p.waitForTimeout(300); const mx = (await st()).mx; await touch('touchEnd', []); const c1 = await cam(p);
  console.log('  drag on court: me x', mx, '| view moved:', c0.az !== c1.az || c0.el !== c1.el);
  await touch('touchStart', [[195, 140]]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[195 + 20 * i, 140 + 6 * i]]); await touch('touchEnd', []); await p.waitForTimeout(900); const c2 = await cam(p);
  console.log('  drag above court: az', c1.az, '->', c2.az, 'el', c1.el, '->', c2.el); await p.screenshot({ path: 'out/stills/c-phone-turned.png' });
  await touch('touchStart', [[150, 500], [250, 500]]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[150 - 8 * i, 500 - 10 * i], [250 + 8 * i, 500 - 10 * i]]); await touch('touchEnd', []); await p.waitForTimeout(900); const c3 = await cam(p);
  console.log('  two fingers: dist', c2.dist, '->', c3.dist, 'el', c2.el, '->', c3.el);
  console.log('phone errors', errs.length, errs.slice(0, 2)); await ctx.close();
}
await b.close();
