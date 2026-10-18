#!/bin/sh
set -eu

# Independent research environment. No SHARP weights or large PLY enter Git.
SHARP_STUDY_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
SHARP_CACHE_DIR="${SHARP_CACHE_DIR:-$HOME/.cache/sharp-study}"
SHARP_CHECKPOINT_DIR="${SHARP_CHECKPOINT_DIR:-$HOME/.cache/torch/hub/checkpoints}"
SHARP_UPSTREAM_COMMIT=aed6527499ef91cba3b54c18d49a870f25947190
mkdir -p "$SHARP_CACHE_DIR" "$SHARP_CHECKPOINT_DIR"
if [ ! -d "$SHARP_CACHE_DIR/ml-sharp/.git" ]; then
  git clone https://github.com/apple-aiml-research/ml-sharp.git "$SHARP_CACHE_DIR/ml-sharp"
fi
git -C "$SHARP_CACHE_DIR/ml-sharp" checkout --detach "$SHARP_UPSTREAM_COMMIT"
uv venv --python 3.12.14 "$SHARP_CACHE_DIR/venv"
uv pip sync --python "$SHARP_CACHE_DIR/venv/bin/python" "$SHARP_STUDY_DIR/environment.lock.txt"
if [ ! -f "$SHARP_CHECKPOINT_DIR/sharp_2572gikvuh.pt" ]; then
  curl -L --fail --retry 3 --output "$SHARP_CHECKPOINT_DIR/sharp_2572gikvuh.pt.part" https://ml-site.cdn-apple.com/models/sharp/sharp_2572gikvuh.pt
  mv "$SHARP_CHECKPOINT_DIR/sharp_2572gikvuh.pt.part" "$SHARP_CHECKPOINT_DIR/sharp_2572gikvuh.pt"
fi
printf '%s\n' "Research environment ready: $SHARP_CACHE_DIR/venv/bin/python"
