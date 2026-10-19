// Headless capture.  node render.mjs stills 0,45,105   |   node render.mjs all   |   node render.mjs audio [gainDb]
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const [mode = 'stills', arg = '0', outArg] = process.argv.slice(2);
const out = outArg || path.join(here, mode === 'all' ? 'out/frames' : 'out/stills');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: process.env.SWIFTSHADER
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
page.on('console', m => { console.log('[page]', m.text().slice(0, 400)); });
page.setDefaultTimeout(0); page.setDefaultNavigationTimeout(0);
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto((process.env.URL || pathToFileURL(path.join(here, 'index.html')).href) + '?capture=1', { waitUntil: 'domcontentloaded' });
page.on('requestfailed', r => console.log('[failed]', r.url(), r.failure()?.errorText)); await page.waitForFunction('window.ready', null, { timeout: 600000 });
await page.evaluate('window.ready');
console.log('gpu:', await page.evaluate(() => { const g = document.createElement('canvas').getContext('webgl2'); const e = g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'n/a'; }));

if (mode === 'audio') {
  const { peak, b64 } = await page.evaluate(g => window.scoreWav(g), +arg || 0);
  const file = outArg || path.join(here, 'out/score-raw.wav');
  writeFileSync(file, Buffer.from(b64, 'base64'));
  console.log('wav', file, 'peak', (20 * Math.log10(peak)).toFixed(2), 'dBFS');
} else {
  const frames = mode === 'all' ? Array.from({ length: 480 }, (_, i) => i) : arg.split(',').map(Number);
  const t0 = Date.now();
  for (const f of frames) {
    await page.evaluate(f => window.renderAt(f / 60), f);
    await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.png`), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    if (mode === 'all' && f % 40 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  console.log('done', frames.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
}
await browser.close();
