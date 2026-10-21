# Scene07 pine158 prototype

The drop-in source is `hero-pines158.js`. Root owns all canonical Scene07
integration. This lane writes only below `lookdev/scene07-pine158`.

Copy the module to `reconstructions/scene-07/src/hero-pines158.js` and change
the existing import path from `./hero-pines148.js` to `./hero-pines158.js`.
The current call and the replay remain exactly the same:

```js
seed = advanceLegacyPineRandom148(seed);
const heroPines148 = await buildHeroPines({emit, mats, hillHeight, group});
```

All eight public origin records, yaw values, seeds, the existing garden
transform and the old RNG replay remain unchanged. The foreground tree's
actual internal height/spread parameters are now 7.2/1.25; its former 4.9/1.4
parameters could not reach the photographed foreground crown from that
fixed root. The actual r05 wood reaches about 6.6 m above that root. Both
nominal metadata and modeled parameters are explicitly retained in the audit.
The builder has its own per-tree random streams. The five existing namespaced
material keys are retained. r05 adds `heroPineInterior158` for the closed
retained-fascicle layer; the helper installs it internally. Existing calls
and info consumers continue to work.

The right tree now has a measured curved main trunk, a higher left return,
sweeping boughs and forward/rear branches that overlap its central crown.
The foreground tree's connected trunk curves from its unchanged hidden root
toward the visible trunk behind the roof, then bears a broad crown. The other
six origin specifications are preserved and use the same new branch/shoot
construction. Every needle-bearing shoot begins on a real wood member.
Fine exterior needles have closed triangular sections, paired fascicles,
six staggered whorls and actual 0.095–0.152 m lengths. Their count per shoot
falls from 80 in r04 to 48 in r05. Mature shoots also carry 16–20 retained
fascicle packets; each is five overlapping closed tapered ribs with separate
pointed ends. These represent optical closure among tightly retained needles
in the interior, underneath the fine outer detail. There is no crown envelope,
leaf sphere, hedge ball, alpha card or camera-facing branch geometry.

The only external surface asset is the already-installed CC0 Poly Haven
Pine Bark map set. The canonical relative path is retained, so no new asset
copy is needed. For a standalone HTTP adapter, the optional `barkAssetBase`
argument accepts the absolute URL of that existing map folder.

`buildPineGeometry158` and `createPineShoot158` expose the exact pure geometry
used by the live builder. `export-pine158.mjs` invokes those functions and
stores a compact binary plus linked shoot transforms. The queued Blender
verifier renders those exact buffers, not an independent approximation.

Rebuild the review data and render through the shared official queue:

```sh
PINE_REVISION=r05 node lookdev/scene07-pine158/export-pine158.mjs
PINE_REVISION=r05 PINE_SIZE=1100 PINE_SAMPLES=32 node tools/run-blender-queued.mjs lookdev/scene07-pine158/render-pine158.py
```

The standalone Cycles material and inspection lighting are separate from
native WebGL lighting and the native needle backscatter shader. The fixed
front, three-quarter and close views verify actual geometry and volume.
Source07 context and photographic framing need root's native integration
render. No photo match or visual acceptance is claimed.

The earlier candidates and their actual renders are retained under r01,
r02 and r03. r01 was rejected for a ladder silhouette. r02 brought the
diagonal structure and canopy overlap closer but still had overly broad
needle sections. r03 narrows those sections and deepens actual bark relief,
but projection against the unchanged physical camera exposed an overly
wide right crown and a low-left foreground crown. r04 repairs those
structural placements with fixed metric curves; no runtime camera input is
used. Native r04 context then revealed lace-like needle noise and too much
bare interior wood. r05 adds the separate dark retained-fascicle layer,
sparser brighter fine outer needles, two broad boughs crossing the right
crown's central gaps, and a wider/higher foreground crown. These remain
review candidates, with photographic fidelity unaccepted.
