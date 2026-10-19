import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('https://hi-loopy.v-001.workers.dev/demo'); await p.waitForTimeout(4000);
console.log(JSON.stringify(await p.evaluate(() => { const v = document.querySelector('video'); return { ready: v.readyState, t: +v.currentTime.toFixed(1), dur: v.duration, w: v.videoWidth, paused: v.paused }; })));
await p.screenshot({ path: 'out/demo-stills/page.png' }); await b.close();
