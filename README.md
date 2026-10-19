# Hi & Lo

A 3D ping pong game in the browser. Live at [hi-loopy.v-001.workers.dev](https://hi-loopy.v-001.workers.dev).

You play Hi, the yellow block, against Lo, the black one. First to 7 wins. The court has lights you can switch to change its mood, and each light has its own sound.

## Features

- Steer with the mouse, a finger or the keyboard. Turn the camera by dragging around the court, pinch to zoom, double-click to reset.
- Lo's aim gets shakier the longer a rally goes, so long rallies are winnable.
- Characters are built from voxels and animated in code.
- A second page, [principles.html](https://hi-loopy.v-001.workers.dev/principles.html), is a playground for the twelve principles of animation: make the character jump, throw it, slow time down, rewind and tune each principle with sliders.

## How it is built

A single HTML page using three.js, with sound made in the browser through the Web Audio API. A small Cloudflare Worker serves the pages and streams the demo video.

The `*test.mjs` and `sim.mjs` scripts drive the game in a headless browser with Playwright. `sim.mjs` plays a perfect Hi against Lo to measure rally length.

## Running it locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765. It needs a local server because the modules are loaded from `vendor/`.

To deploy:

```bash
cp index.html principles.html dist/ && cp -R vendor dist/ && npx wrangler@4 deploy
```

## Credits

- [three.js](https://threejs.org), MIT licence.
- Geist Mono font, SIL Open Font License.

## Licence

Code is MIT. See [LICENSE](LICENSE).
