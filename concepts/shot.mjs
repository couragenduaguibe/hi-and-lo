import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); p.setDefaultTimeout(0);
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + process.cwd() + '/concepts/mascots.html', { waitUntil: 'domcontentloaded' });
await p.waitForFunction('window.ready'); await p.evaluate('window.ready'); await p.waitForTimeout(400);
await p.screenshot({ path: 'concepts/moodswings-mascots.png' }); await b.close(); console.log('ok');
