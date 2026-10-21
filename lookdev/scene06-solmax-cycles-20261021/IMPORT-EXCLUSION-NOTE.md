# Determinant-only exclusion limitation

The held importer excluded two lacquer instances, 24 indexed triangles, using a zero-determinant test. A zero determinant alone does not establish that every transformed triangle has zero area: a rank-2 transform can retain valid planar surfaces. The historical script/report wording that calls all 24 triangles zero-area is therefore unverified and must not be read as an exact transformed-area check.

The actual R9 source buffers, selected/rejected rendered images, source snapshots and packed editable study are preserved. A later importer revision must retain valid transformed planes and decide any degenerate-face exclusions from exact transformed triangle area. No new import/area audit or corrective render is started here; current work is R10 sculpture geometry. This note supersedes the broad zero-area inference in the historical receipts. `visualAccepted: false`.
