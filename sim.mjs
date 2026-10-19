import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 900, height: 700 } })).newPage(); p.setDefaultTimeout(0);
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready');
for (const wob of [0.6, 0.0]) { const r = await p.evaluate(w => window.debugSim(600, w), wob); r.sort((a, b) => a - b); console.log('wobble', wob, 'points', r.length, 'mean rally', (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1), 'median', r[r.length >> 1], 'max', r[r.length - 1]); }
await b.close();
