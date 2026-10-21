# Scene07 sky145 R04 — selected improved sky checkpoint

The current native view has a credible golden-hour cloud field behind the pagoda and hall. The former featureless dull brown is replaced by separated small cloud masses, natural lavender-gray interiors, thin warm rims and pale blue gaps. This is a coherent improved sky checkpoint; the scene remains a draft and visualAccepted is false.

Selected source hash:72cca037d5e5e616afa171f820a28929861800e32665b3214da278b538d8f2ff. The full1254 frame and genuine1254 sky subfrustum detail were captured by tools/render-one-reconstruction.mjs under its shared GPU mutex. The pond detail and three original-path positions0/3.5/7 use the same complete source hash and the same official renderer. Shader linking, finite pixels and clean errors are technical checks only.

## Review files

- reference.png: native1254 square reference-camera frame.
- detail-native.png: actual native1254 subfrustum from full-resolution coordinates300,0,630,1254; no screenshot enlargement.
- reference-left-baseline-middle-r04-right.png: comparison inputs are reference7, root03 brown-sky native frame, selectedR04 native frame, in that order.
- sky-comparison-reference-baseline-r04.png: top480pixels of those same three images, no rescaling.
- ../iteration-scene07-solmax-cloud-sky-r04-reflection-20261021/detail-native.png: genuine1254 pond/bridge/lantern subfrustum at520,650,550,1254. The revised sky also appears through the existing planar reflection path.
- ../iteration-scene07-solmax-cloud-sky-r04-path-20261021/shot-0.png, shot-3p5.png, shot-7.png: three actual960 native snapshots along the existing camera path. Cloud orientation stays fixed in world space; these three stills are not a continuous motion-film receipt.
- scope-and-calibration-proof.json: exact source hashes, unchanged original files/global asset bytes, radiance calibration, all same-source capture receipts and remaining gaps.
- scene07-sky145-r04-source.tar.gz: complete current local Scene07 namespace. Shared CC0 assets remain at their original immutable paths, with hashes in report.json.

## Construction and calibration

The actual CC0 Qwantani Sunset Pure Sky EXR continues to supply the PMREM environment at intensity0.38 with its original measured full solar-centroid alignment. All main geometry, lighting, camera, renderer and reflection code are unchanged. The only preexisting files changed by this lane are src/sky-radiance144.js and asset-dependencies.json; all new assets and metadata live in Scene07 assets/sky145.

The visible cloud atlas was made with the built-in imagegen tool. It contains only independent atmosphere and clouds: no architecture, foliage, mountain, terrain, water or reference-scene plate. Reference7 guided cloud size/color only during original cap generation. R04 refined that generated asset by breaking the large central cloud bank into smaller separated tufts. Both exact prompts, input roles, generated file identities, license distinctions and transformations are retained in assets/sky145/provenance.json and the two generation metadata files.

The1774x887 sRGB atlas is a70x35degree spherical cap, with elevation-5..30degrees and center azimuth43degrees from the actual existing sun. The requested solar illumination lies8degrees beyond its left edge at13.5degrees elevation. An8percent border blends to the original aligned measured HDR camera sky. The atlas is hardware-decoded to linear and multiplied1.1 before the scene's existing ACES OutputPass. This is explicitly an artistic LDR camera-sky radiance proxy; it is not measured HDR. The sphere is re-centered on each real/virtual camera while lookup uses world directions, giving no translation parallax and consistent reflection orientation.

## Remaining visible gaps

Cloud placement and rim radiance differ from reference7, and actual native detail still looks softer than the source. The current physical sun is outside the left edge of the47degree camera view, while the source shows a visible low sun. Correcting that would require changing the retained light/camera relationship, outside this narrow lane. Existing geometry, mountain silhouette, foliage and material/light response remain visibly less photographic and were preserved.

R01 andR02 are rejected sky candidates with their native images, exact helper/metadata and honest review notes retained. R03 is an intermediate improved cap, also retained. Earlier rootR01/R02/R03 receipts were not modified or removed. No photographic acceptance is inferred from successful GL/shader checks.
