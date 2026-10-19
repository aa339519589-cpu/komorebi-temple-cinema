# Exact v3 gray-occluder diagnosis

No GPU job or runtime edit was used. `gray-occluder-debug.mjs` loads the actual
v3 scene in Node, with unchanged local glTF buffers and 1 px texture placeholders
that do not alter ray geometry. It instruments `emit`, `between`, `group` and
the final instance buckets **in memory** to retain original source calls and
instance matrices. The rebuilt scene exactly matches actual v3's 443,809
instances, triangle count, final RNG and selected scan placement.

The 16 camera rays use the original 1254-square camera. The raw JSON includes
nearest opaque hits, gray surfaces behind foreground foliage, original source
call stacks, actual float32 instance transforms, world centres/extents/bounds,
and the gallery/bridge structural inventory. The smaller findings JSON
deduplicates the five principal structural sources.

## The visible faces are different load-bearing objects

| Pixel(s) | Actual first opaque hit | Source / stone-box instance |
|---|---|---|
| `(620,850)`, `(620,880)`, `(620,900)` | Wing middle-right pier | `scene.js:82`, `hall` pier-mode branch, called from `scene.js:123`; instance 7 |
| `(650,890)`, `(650,910)` | Middle-gallery rear-left pier | `scene.js:124`, `box(-1.4,-1.835,-1.45,.36,3.19,.4,'stone')`; instance 11 |
| `(700,930)` | Separate wing lower foundation | `scene.js:123`, `box(0,-.6,0,4.7,1.8,8.8,'stone')`; instance 2 |
| `(750,870)`, `(750,930)`, `(730,970)`, `(780,900)`, `(825,995)` | Low-end bridge/stair landing abutment | `corridor-layout.js:77`, first `[C.a,.7]` iteration; instance 24 |
| `(830,880)`, `(800,900)`, `(820,930)` | Actual opaque maple leaf, with instance 24 behind it | The gray surface behind is the same low-end bridge abutment |

The leaf material has `transparent:false`, `opacity:1`, `alphaTest:0`, no alpha
map and `DoubleSide`; this is real leaf-triangle occlusion rather than an
unhandled alpha cutout. Postprocess blur/antialiasing can mix pixels at edges.

### Wing pier and its separate lower foundation

The middle-right pier has local centre `[1.855,1.18,0]`, size
`[.4,2.36,.44]`, under `group(-1.86,1.5,-7.5,-.55)`.
Its world centre is approximately `[-.278567,2.68,-6.530415]`; world AABB
is `[-.564063,1.5,-6.822508]` to `[.006929,3.86,-6.238322]`.
Its head actually bears on the wing beam at Y3.86. It cannot be removed merely
because its face is visible: it is part of the six-pier load path to the Y4.50
floor. It is above the water plane, so its water-plane intersection area is zero.

The separate lower foundation survived the pier-mode replacement. Its world
centre is `[-1.86,.9,-7.5]`, local box size `[4.7,1.8,8.8]`, yaw -.55. Its
world AABB spans `[-6.163256,0,-12.479423]` to
`[2.443256,1.8,-2.520577]`. This broad box supports the piers' Y1.5 feet,
which embed .3 m into it. It intersects **.752825 m²** of the actual water plane.
Changing `hall(...,baseMode:'piers')` alone never removed this independent box.

### Middle-gallery pier

Local centre `[-1.4,-1.835,-1.45]`, size `[.36,3.19,.4]`, under
`group(1.47,4.28,-9,-.1)`. World centre `[.221753,2.445,-10.582522]`,
AABB `[.022685,.85,-10.799493]` to `[.420820,4.04,-10.365552]`.
It supports the Y4.04 bearing beam/platform stack up to the Y4.50 floor. It is
north of the reflector's far edge Z-6.3 and does not intersect its water plane;
its tall gray face still visually occupies the photo's intended garden gap.

### Both bridge-end abutments

Both are emitted by the same loop at `corridor-layout.js:77`, yaw .5794663.
They are distinct instances and must not be conflated.

| End | World centre | Local size | World Y interval | Actual water-plane overlap |
|---|---|---|---|---:|
| Low / stair end, instance 24 | `[1.9,1.75,-3.7]` | `[1.05,2.10,1.70]` | `.70…2.80` | 1.606239 m² |
| High / right-gallery end, instance 25 | `[7.50189,2.5,-7.36591]` | `[1.05,3.10,1.70]` | `.95…4.05` | 0 |

The low-end box's world AABB is `[.995263,.70,-4.698720]` to
`[2.804737,2.80,-2.701280]`. Its conservative projected AABB is roughly
X705…883, Y864…1058, explaining the broad central gray face. Its top Y2.80
bears against the first bridge board underside Y2.79527 and the stone stair
stringer. Deleting the box without a new bearing structure would suspend both.

There is also an actual support error: downward rays against the real terrain
**and** real rock geometry at the old low-pier centre and four footprint samples
all hit Y-.40. The guessed bottom Y.70 is **1.10 m above support**. The broad
flat bed box at Y-.40 is higher than the channel terrain Y-.50 and is therefore
the first real ground surface. The high-end centre terrain is approximately
Y.7255 and one nearby sample intersects a real rock at Y1.3145; it is a separate
bank-side support problem, not the central water occluder.

## Coherent replacement plan

The next authorized bounded change should replace only the low-end solid with
a closed stone landing cap retaining top Y2.80, original width/load path and
unchanged bridge/stair landing coordinates. Two narrower coursed/battered
flanking piers should reach from measured bed/ground to the cap underside,
leaving a genuine open water/rock bay between them. The measured candidate
flanks ±.55 m across the bridge have support at Y-.40 on one side and
Y-.40…-.0483 near the other bank. Footing bottoms must be sampled and shallowly
embedded in those actual surfaces rather than copied from the old .70 datum.

The identified wing pier may be recast as real rough coursed stone within its
existing bearing/contact envelope, preserving its load path. The broad wing
lower foundation and the middle-gallery piers remain separate site-layout work;
they must not be blindly removed, painted dark or hidden with added foliage.
A later whole-site correction needs explicit bank/terrace geometry and supported
transfer members before relocating their feet outside the water corridor.

```sh
node --max-old-space-size=4096 qa/ten-reference/08/layout122/gray-occluder-debug.mjs
```
