// Renders scene.html frame by frame with headless Chromium, then encodes with ffmpeg.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const out = process.argv[2] || path.join(__dirname, 'frames');
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e); process.exit(1); });
  await page.goto('file://' + path.join(__dirname, 'scene.html'));
  const b64 = fs.readFileSync(path.join(__dirname, 'logo.jpg')).toString('base64');
  const dbg = await page.evaluate(s => window.init(s), 'data:image/jpeg;base64,' + b64);
  console.log(JSON.stringify(dbg));
  const frames = only || [...Array(450).keys()];
  for (const f of frames) {
    await page.evaluate(f => window.render(f), f);
    await page.screenshot({ path: path.join(out, `f${String(f).padStart(4, '0')}.png`) });
    if (f % 50 === 0) console.log('frame', f);
  }
  await browser.close();
})();
