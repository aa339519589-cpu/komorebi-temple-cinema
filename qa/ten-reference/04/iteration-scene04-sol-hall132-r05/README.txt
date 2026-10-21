Scene04 hall132 R05: held, unaccepted native geometry checkpoint

Runtime source identity:
45f00b80a7ea83fd1870b699ba74fe381f537600ed085284d5b458b5e6b93275

This is a new connected hall-roof/porch/column reconstruction, following approximate manually observed contours in references/hd/3-照片-4.jpg. It replaces the old continuously flared trapezoidal upper roof with a narrow steep neck and later wing flare, uses a common eight-station karahafu profile, rebuilds the structural timber paths and turned front columns, and keeps tile courses at a 270mm metric lane width. The existing camera/film path, stairs/landing, toro and approach geometry are preserved. The hall has an inferred 120mm lateral/100mm rear offset; attached bays, portal, sockets and carvings follow the same frame. R05 corrects the winding of the left ridge-end sculpture with a rigid rotation.

The reference photo is used for comparison and manually read numeric landmarks only. No photograph RGB, depth estimate, scene replacement image, projected backdrop or painted shadow is introduced by this reconstruction. New geometry is authored in source. Existing material and licensed asset dependencies remain recorded in retained-source.json and the repository provenance JSON files.

Full reference-camera native image: reference.png
Genuine native roof/portal subfrustum: detail-native.png
Both are 1254x1254. The detail is a new native render from the unchanged physical camera with view offset [275,120,710,1254], not a resized beauty crop.

Final oblique: ../iteration-scene04-sol-hall132-r05-oblique/inspection-view.png
It uses position [-5,6,10], target [0,7,0], FOV75 and is an inspection view of the same existing model.
The final oblique has been visually reviewed. It exposes the portal depth and closed roof-bearing assembly clearly; no new visible detached roof/column/stair break was found in this view. Upper-eave infill and fascia sections still read too regular. This is not a structural certification or source-photo match.

Native film poses: ../iteration-scene04-sol-hall132-r05-poses/{shot-0.png,shot-3p5.png,shot-7.png}
The unchanged low opening frames paving/stairs and crops the roof; the end reveals the full hall. The poses have been visually reviewed. They do not establish continuous-motion flicker performance. Root owns the separate continuous film capture and integration.

All captures use tools/render-one-reconstruction.mjs and its official shared GPU mutex. final-review.json is produced only after all three native reports are complete, have the held source identity, and contain valid1254px images with no render errors. Successful GPU diagnostics are not photographic acceptance.

The full and close views have been compared visually with the original photograph. The neck/wing shape and common porch/column assembly improve the hall mass substantially, but the fascia/band section is still too heavy and regular; carved brackets/transoms, lattice bays, roof crests/ornaments, sanctuary, vegetation and stone-lantern wear remain approximate. Tile seams expose repetitive warm deck marks. The native light and mineral/timber response remain much less photographic than the reference. visualAccepted remains false.

retained-source.json records every runtime/declared dependency hash. source-scripts-and-provenance.tar.gz contains52 editable Scene04 namespace scripts/HTML/provenance/dependency JSON files. It does not duplicate all binary/bitmap dependencies; use their exact repository paths and hashes in retained-source.json. build-handoff.mjs reproduces the archive, comparison composites and final capture manifest without rewriting runtime source or native receipts.

Comparison PNGs are QA composites only: source left / native right, and old model131 left / new hall132 right. They never enter the rendered scene. The original model131 R05 native folder and all hall132 intermediate/failed receipts remain available. The earlier physical Cycles R05 study is immutable and uses the different old runtime source a54f64c748ae854462e55429449a78611f7c8feb45f95f02f94dbd3636e61668; it is not an exported physical model of this new hall132 source.

No commits or uploads are performed by this lane. Runtime remains held for root's movie and source integration.
