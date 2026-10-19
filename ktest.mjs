import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage(); p.setDefaultTimeout(0);
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('https://animation-principles-loop.v-001.workers.dev/', { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready'); await p.waitForTimeout(1500);
const st = () => p.evaluate(() => ({ ...window.debugState(), active: document.activeElement.tagName + '#' + document.activeElement.id }));
await p.click('#slow'); await p.click('#slow'); await p.click('[data-view=close]'); console.log('focus after button clicks:', (await st()).active);
await p.keyboard.down('Space'); await p.waitForTimeout(80); await p.keyboard.up('Space'); await p.waitForTimeout(1200); const s3 = await st(); console.log('space after buttons: idx', s3.idx, 'speed', s3.speed);
await b.close();
