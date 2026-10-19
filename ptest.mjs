import { chromium } from 'playwright-core';
const url = process.env.URL || 'http://localhost:8765/index.html';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
async function run(name, opt, steps) {
  const ctx = await b.newContext(opt), p = await ctx.newPage(); p.setDefaultTimeout(0);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/404/.test(m.text()) && errs.push(m.text()));
  await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready'); await p.waitForTimeout(1500);
  const st = () => p.evaluate(() => window.debugState()), pos = n => p.evaluate(n => window.debugPos(n), n);
  await steps(p, n => p.screenshot({ path: `out/stills/h-${name}-${n}.png` }), st, pos);
  console.log(name, 'errors', errs.length, errs.slice(0, 3));
  await ctx.close();
}
await run('desktop', { viewport: { width: 1280, height: 800 } }, async (p, shot, st, pos) => {
  await shot('0-choose'); let s = await st(); console.log('  start:', s.state, '| card:', (await p.textContent('#msg')).trim());
  await p.click('[data-pick=lo]'); s = await st(); console.log('  picked lo:', s.state, 'me', s.me, 'faces hi/lo', s.faces, 'z', s.z, '| card:', (await p.textContent('#msg')).trim());
  let c = await pos('x0'); await p.mouse.click(c[0], c[1]); await p.waitForTimeout(400); s = await st(); console.log('  served:', s.state, 'ball z', s.bz);
  let a = await pos('x2'); await p.mouse.move(a[0], a[1]); await p.waitForTimeout(350); console.log('  steer me x', (await st()).mx, 'lo x', (await st()).lx);
  await shot('1-as-lo');
  // lights: tap switches; a drag must NOT move them
  let k = await pos('key'); await p.mouse.move(k[0], k[1]); await p.mouse.down(); await p.mouse.move(k[0] - 300, k[1] - 40, { steps: 8 }); await p.mouse.up(); s = await st(); console.log('  after dragging key light: rig', s.rig.key, 'on', s.lights.key);
  k = await pos('top'); await p.mouse.click(k[0], k[1]); s = await st(); console.log('  tap top:', s.lights.top, '|', s.mood);
  await p.evaluate(() => window.debugAuto(true)); for (let i = 0; i < 80; i++) { s = await st(); if (s.state === 'over') break; await p.waitForTimeout(3000); }
  console.log('  end:', s.state, s.hi, s.lo, '| card:', (await p.textContent('#msg')).trim()); await shot('2-over');
  await p.click('[data-pick=hi]'); s = await st(); console.log('  picked hi:', s.state, 'me', s.me, 'faces', s.faces, 'score', s.hi, s.lo); await p.keyboard.press('Space'); await p.waitForTimeout(500); await shot('3-as-hi'); console.log('  space serve:', (await st()).state);
});
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, async (p, shot, st, pos) => {
  await shot('0'); await p.tap('[data-pick=hi]'); const c = await pos('x0'); await p.touchscreen.tap(c[0], c[1]); await p.waitForTimeout(1200); await shot('1'); const s = await st(); console.log('  phone:', s.state, 'me', s.me, 'faces', s.faces);
});
await b.close();
