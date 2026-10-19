// node demo.mjs stills 30,150,...   |   node demo.mjs all   (frames + soundtrack)
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
const [mode = 'stills', arg = '0'] = process.argv.slice(2);
const out = mode === 'all' ? 'out/demo' : 'out/demo-stills'; mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 }); p.setDefaultTimeout(0);
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html?demo=1', { waitUntil: 'domcontentloaded' }); await p.waitForFunction('window.ready'); await p.evaluate('window.ready');
const N = await p.evaluate('window.DEMO_FRAMES'), frames = mode === 'all' ? Array.from({ length: N }, (_, i) => i) : arg.split(',').map(Number), t0 = Date.now();
for (const f of frames) {
  await p.evaluate(f => window.demoFrame(f), f);
  await p.screenshot({ path: `${out}/f${String(f).padStart(4, '0')}.png` });
  if (mode === 'all' && f % 120 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
if (mode === 'all') { const a = await p.evaluate(() => window.demoAudio()); writeFileSync('out/demo-raw.wav', Buffer.from(a.b64, 'base64')); console.log('audio events', a.events, 'final score', a.score); }
else console.log(JSON.stringify(await p.evaluate(() => window.debugState())));
console.log('done', frames.length, ((Date.now() - t0) / 1000).toFixed(0) + 's'); await b.close();
