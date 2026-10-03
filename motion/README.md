# LSG Racing — motion design (15 s)

`lsg_racing_motion.mp4` — 1920×1080, 30 fps, H.264 + AAC.

Regenerate:

```sh
node motion/audio.js soundtrack.wav
NODE_PATH=$(npm root -g) node motion/render.js frames
ffmpeg -framerate 30 -i frames/f%04d.png -i soundtrack.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest motion/lsg_racing_motion.mp4
```

`scene.html` extracts the lion and letters from `logo.jpg` and animates them on a canvas;
`render.js` captures each frame with headless Chromium; `audio.js` synthesises the soundtrack.
