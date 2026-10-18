# Live reference alignment and continuation rendering

This addition **does not replace** `render-v3.html` (which exists, but loads a frozen V3 source). It renders the **current** `src/main.js` through `render-live.html`.

## Live image-to-source comparison

With Node.js >=24.2, start `node serve.mjs`, then open `http://127.0.0.1:4317/compare-live.html` on the rendering Mac. The left image is one of the supplied reference files; the right image is created by the current Three.js WebGL scene at a reproducible camera. Camera position, target, FOV and time are editable; use **Export camera JSON** to preserve a visual-fit candidate, or save a side-by-side PNG.

The ten reference images in the latest user message are in a different order from the repository's original stable IDs: `10,9,7,8,4,6,5,1,3,2`. Both the comparison page and runner use this explicit mapping. Canonical reference 1 is now accompanied by the newly supplied 1254 × 1254 JPEG at `references/hd/0-照片-1.jpg`. The live page still allows temporary local replacement of any reference image. No photograph is sent to a server.

## Mac-only scripted rendering

Uses the existing `tools/render-runtime.mjs` to find a locally installed Playwright and Chromium. This is a Mac/Metal path by default, without fallback to a cloud renderer. Install Playwright separately only if the existing local Codex runtime does not already supply it; FFmpeg and FFprobe are needed for paired reference images and film output.

```sh
MODE=references node tools/render-current.mjs
MODE=film DURATION=70 WIDTH=1920 SAMPLES=3 node tools/render-current.mjs
MODE=film DURATION=60 WIDTH=1920 SAMPLES=3 node tools/render-current.mjs
```

`MODE=all` renders the reference comparisons and a film. `SHOTS=1,2,3` selects canonical film shot numbers; missing segments prevent full-film assembly. All output lives in `output/continuation-<revision>-<sourcehash>/` (separate from rejected V1 and unfinished V3). A finished segment is reused only if its metadata and FFprobe frame count match; modified scene source aborts before combining different revisions. The film is a **review candidate**, not an image-fidelity certification.

Source freezes, private photo-derived notes, bridge credentials and the six parallel rendering workers are untouched. This script does not claim a real GPU run until its Mac-side report exists, and it does not automatically upload or return frames. Private bridge integration requires its existing runtime connection rather than guessed endpoints or credentials.