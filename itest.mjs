import { chromium } from 'playwright-core';
const url = process.env.URL || 'http://localhost:8765/index.html';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const only = process.env.ONLY;
async function run(name, opt, steps) {
  if (only && only !== name) return;
  const ctx = await b.newContext({ acceptDownloads: true, ...opt }), p = await ctx.newPage(); p.setDefaultTimeout(0);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !/404/.test(m.text()) && errs.push(m.text()));
  await p.goto(url, { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready');
  await p.waitForTimeout(2000);
  const st = () => p.evaluate(() => window.debugState()), pos = n => p.evaluate(n => window.debugPos(n), n);
  await steps(p, n => p.screenshot({ path: `out/stills/t-${name}-${n}.png` }), st, pos);
  console.log(name, JSON.stringify(await p.evaluate(() => window.quality())), 'errors', errs.length, errs.slice(0, 3));
  await ctx.close();
}
const peakY = async (p, ms) => { let m = 0; const t = Date.now(); while (Date.now() - t < ms) { m = Math.max(m, (await p.evaluate(() => window.debugState().y))); await p.waitForTimeout(25); } return m; };
await run('desktop', { viewport: { width: 1280, height: 800 } }, async (p, shot, st, pos) => {
  let m = await pos('mascot');
  await p.mouse.click(m[0], m[1]); const tapPeak = await peakY(p, 1100); let s = await st();
  console.log('  tap jump: peak', tapPeak, 'idx', s.idx, 'labels', s.labels, 'lit', s.lit);
  m = await pos('mascot'); await p.mouse.move(m[0], m[1]); await p.mouse.down(); await p.waitForTimeout(1000); await shot('1-charging'); await p.mouse.up();
  const holdPeak = await peakY(p, 1300); s = await st(); console.log('  charged jump: peak', holdPeak, 'idx', s.idx, 'labels', s.labels);
  // throw
  m = await pos('mascot'); await p.mouse.move(m[0], m[1]); await p.mouse.down();
  await p.mouse.move(m[0] - 120, m[1] - 200, { steps: 10 }); await p.waitForTimeout(150); await shot('2-carried'); s = await st(); console.log('  carried:', JSON.stringify({ phys: s.phys, x: s.x, y: s.y }));
  await p.mouse.move(m[0] + 160, m[1] - 260, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(350); await shot('3-thrown');
  await p.waitForTimeout(4500); s = await st(); console.log('  after throw:', JSON.stringify({ phys: s.phys, x: s.x, y: s.y, idx: s.idx, lit: s.lit }));
  // light: drag then toggle
  let k = await pos('key'); await p.mouse.move(k[0], k[1]); await p.mouse.down(); await p.mouse.move(k[0] - 260, k[1] + 10, { steps: 8 }); await p.mouse.up();
  s = await st(); console.log('  key rig moved to', s.rig.key, 'lights', JSON.stringify(s.lights)); await p.waitForTimeout(300); await shot('4-light-moved');
  k = await pos('top'); await p.mouse.click(k[0], k[1]); s = await st(); console.log('  top toggled:', s.lights.top);
  await p.mouse.click(k[0], k[1]);
  // tune + slow + scrub
  await p.click('#tune'); await p.evaluate(() => { const r = document.querySelectorAll('#labels input'); r[1].value = 2; r[1].dispatchEvent(new Event('input')); r[4].value = 0; r[4].dispatchEvent(new Event('input')); });
  m = await pos('mascot'); await p.mouse.click(m[0], m[1]); const flat = await peakY(p, 1100); console.log('  arcs dial at 0: peak', flat);
  await p.evaluate(() => { const r = document.querySelectorAll('#labels input'); r[4].value = 1; r[4].dispatchEvent(new Event('input')); });
  await shot('5-tune');
  await p.click('#slow'); s = await st(); const c0 = s.clock; await p.waitForTimeout(1000); s = await st(); console.log('  slow: speed', s.speed, 'frames in 1s', s.clock - c0); await p.click('#slow');
  m = await pos('mascot'); await p.mouse.click(m[0], m[1]); await p.waitForTimeout(1200);
  const box = await p.locator('#scrub').boundingBox(); await p.mouse.move(box.x + box.width - 4, box.y + box.height / 2); await p.mouse.down(); await p.mouse.move(box.x + box.width * 0.72, box.y + box.height / 2, { steps: 6 }); await p.waitForTimeout(200);
  const c1 = (await st()).clock; await p.waitForTimeout(500); const c2 = (await st()).clock; await shot('6-scrub'); await p.mouse.up(); console.log('  scrub: clock held', c1 === c2);
  // keyboard
  await p.keyboard.press('2'); await p.keyboard.down('Space'); await p.waitForTimeout(80); await p.keyboard.up('Space'); const kp = await peakY(p, 1500); console.log('  space jump peak', kp, 'idx', (await st()).idx); await shot('7-close-view');
  await p.keyboard.press('1');
  // record
  await p.click('#snd'); await p.click('#rec'); await p.waitForTimeout(1500); await p.click('#rec'); await p.waitForTimeout(800); s = await st(); console.log('  rec:', s.rec, '| button:', await p.textContent('#rec'), '| sound:', await p.textContent('#snd'));
  await p.waitForTimeout(600); await shot('8-end');
});
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, async (p, shot, st, pos) => {
  const m = await pos('mascot'); await p.touchscreen.tap(m[0], m[1]); await p.waitForTimeout(1300); const s = await st(); console.log('  tap jump idx', s.idx, 'labels', s.labels);
  await shot('1'); await p.tap('#tune'); await p.waitForTimeout(300); await shot('2-tune');
});
await run('phone-landscape', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, async (p, shot) => { await shot('1'); });
await b.close();
