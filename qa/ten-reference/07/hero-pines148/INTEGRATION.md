# Scene07 hero pines 148

Source module: `reconstructions/scene-07/src/hero-pines148.js`.

Root owns the integration and captures. Add the named imports
`buildHeroPines, advanceLegacyPineRandom148` from `./hero-pines148.js`.
At the former eight `pine(...)` calls, while `gardenTransform` is active:

```js
seed = advanceLegacyPineRandom148(seed);
const heroPines148 = await buildHeroPines({emit, mats, hillHeight, group});
```

The optional random replay preserves the positions/tints of the existing
downstream cherries, grass and other garden objects. The new trees use an
independent per-tree stream. The existing `leafG` and `needle` material setup
is still used by cherries and grass; removing the old pine functions does not
imply removing that setup.

`group(x,y,z,yaw,scale,fn)` and `emit(geometry,key,x,y,z,sx,sy,sz,rot,tint)`
match the existing Scene07 functions. `rod` and `box` are not required.
All old tree origins and the existing worldZ = gardenZ * .6 - 3 mapping remain.
Only five new namespaced material keys are added to `mats`.
The async helper waits for its three local bark textures before building, so
the existing scene-ready signal also implies material readiness.
The return object contains tree origins, wood bounds and geometry counts and
can be included in `sceneInfo` as `heroPines148`.

The right hero and low foreground pine were authored against the true HD
source details saved beside this note. Each has its own trunk/fork profile,
unequal exposed supporting boughs and separated shallow crown shelves.
The foliage consists of dense slender closed paired needles on actual
shoots, attached to short branchlets, attached to fan branches, attached to
substantial boughs. There are no crown hulls, foliage cards or scene-image
billboards. r03 uses 45 overlapping pairs per shoot, with triangular volume
sections and .10-.18m lengths. Fan and branchlet heights vary to form lobed
shallow volumes instead of level carpets. Primary boughs rise gently and the
foliage begins farther inward over their outer portions. Tuft sizes do not
scale directly with tree height.

Bark has authored geometric fluting and independent CC0 surface-scan maps:
[Pine Bark](https://polyhaven.com/a/pine_bark), Dimitrios Savva, 2m physical
coverage, [CC0 license](https://polyhaven.com/license). Three original JPGs
(2,522,778 bytes) are retained unmodified and verified against the provider's
MD5/size. SHA256, source URLs and author credit are recorded in
`reconstructions/scene-07/assets/hero-pines148/pine-bark/provenance.json`.

Root's actual full/detail captures are at
`qa/ten-reference/07/iteration-scene07-aged-pine-and-aligned-sun148-r01-20261021/`
and the equivalent `r02` iteration. r01 had visible branching but inadequate
foliage occupancy and overly regular gray bark. r02 improved occupancy and
the bark, but its wide spindle interiors read as broad leaves, and its shelf
heights were too even. Both helper candidates are preserved beside this note
in `r01-preserved/` and `r02-preserved/`.
No shared source, main file, camera, roof, sky or light has been edited by
this lane. r03 remains unaccepted (`visualAccepted: false`), pending root's
full/detail native capture and visual repair.
