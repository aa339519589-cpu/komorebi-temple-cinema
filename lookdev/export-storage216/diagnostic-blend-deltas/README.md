# Exact-byte archive of old diagnostic passes

Nineteen unselected Scene01 diagnostic `.blend` passes were reversibly archived
as Zstandard binary deltas against the independent `immutable-reference.blend`.
Each complete reconstructed byte stream was checked against the original size
and SHA-256 **before** removing the corresponding raw intermediate file. The
manifest records original paths, hashes, modes and timestamps. No source asset,
rendered image, selected final/base project or selected packed model was removed.
Four selected final/base files remain at their original paths with unchanged
SHA-256 values. Archiving is storage maintenance, not a rendering improvement.

The 2,072,111,639 original bytes are recoverable from a 110,084,680-byte reference
and 308,881,706 bytes of deltas. The reference is an independent APFS copy-on-write
clone, not a hard link to a mutable selected file. It and the deltas are read only.
The initial pilot delta is retained separately as a diagnostic, not required for
restoration. `archive-manifest.json` is the authoritative mapping.

Binary assets are published at the
[SOL 6.1 modeling progress prerelease](https://github.com/aa339519589-cpu/komorebi-temple-cinema/releases/tag/modeling-progress-2026-10-24-sol61).
From the repository root, obtain the archive reference and deltas with:

```sh
gh release download modeling-progress-2026-10-24-sol61 \
  --repo aa339519589-cpu/komorebi-temple-cinema \
  --pattern 'immutable-reference.blend' --pattern '*.delta.zst' \
  --dir lookdev/export-storage216/diagnostic-blend-deltas
python3 lookdev/export-storage216/restore-diagnostic-blend-pass.py --list
```

Restore one exact path printed by `--list` by passing it as the script's single
argument. Restoration checks the base and delta hashes, requires disk headroom,
refuses overwrites, verifies the entire output, and restores the recorded mode
and timestamps. Existing project/asset-specific licenses and attribution remain
in force; this storage representation does not relicense their contents.
