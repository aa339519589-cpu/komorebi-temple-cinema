#!/bin/sh
set -eu
DEPTH_FIELD_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
DEPTH_CACHE_DIR="${DEPTH_CACHE_DIR:-$HOME/.cache/depth-field}"
DEPTH_RUNTIME_DIR="${DEPTH_RUNTIME_DIR:-$DEPTH_CACHE_DIR/venv}"
mkdir -p "$DEPTH_CACHE_DIR/checkpoints"
if [ ! -d "$DEPTH_CACHE_DIR/Depth-Anything-V2/.git" ]; then
 git clone https://github.com/DepthAnything/Depth-Anything-V2.git "$DEPTH_CACHE_DIR/Depth-Anything-V2"
fi
git -C "$DEPTH_CACHE_DIR/Depth-Anything-V2" checkout --detach a561b849ebae10a6f5ef49e26c83cbbcd36c71bf
if [ ! -f "$DEPTH_RUNTIME_DIR/bin/python" ]; then
 uv venv --python 3.12.14 "$DEPTH_RUNTIME_DIR"
fi
uv pip sync --python "$DEPTH_RUNTIME_DIR/bin/python" "$DEPTH_FIELD_DIR/environment.lock.txt"
if [ ! -f "$DEPTH_CACHE_DIR/checkpoints/depth_anything_v2_vits.pth" ]; then
 curl -L --fail --retry 3 --output "$DEPTH_CACHE_DIR/checkpoints/depth_anything_v2_vits.pth.part" https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth
 mv "$DEPTH_CACHE_DIR/checkpoints/depth_anything_v2_vits.pth.part" "$DEPTH_CACHE_DIR/checkpoints/depth_anything_v2_vits.pth"
fi
printf '%s  %s\n' 715fade13be8f229f8a70cc02066f656f2423a59effd0579197bbf57860e1378 "$DEPTH_CACHE_DIR/checkpoints/depth_anything_v2_vits.pth" | shasum -a 256 -c -
printf '%s\n' "Depth Anything V2 Small runtime: $DEPTH_RUNTIME_DIR/bin/python"
