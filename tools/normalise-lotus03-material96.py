#!/usr/bin/env python3
"""Record a constant PBR tint; leave the generated diffuse image unmodified.

The target is the preceding procedural material's mean diffuse reflectance.
It is an isolation control for the fine-vein comparison, not a photographic
measurement or a reconstruction of the reference image's reflectance.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'reconstructions/scene-03/assets/lotus-leaf96'
SOURCE = ASSETS / 'neutral-leaf-diffuse-v01.png'


def linear(rgb):
    return np.where(rgb <= .04045, rgb / 12.92,
                    ((rgb + .055) / 1.055) ** 2.4)


rgb = np.asarray(Image.open(SOURCE).convert('RGB'), dtype=np.float64) / 255
height, width = rgb.shape[:2]
y, x = np.mgrid[:height, :width]
disc = np.hypot(x / (width - 1) - .5, y / (height - 1) - .5) < .49
atlas_mean = linear(rgb)[disc].mean(axis=0)

# Reproduce the old 512px DataTexture, including JavaScript's signed remainder
# and Uint8 truncation. No new bitmap is written by this script.
y, x = np.mgrid[:512, :512]
u, v = (x / 511 - .5) * 2, (y / 511 - .5) * 2
r, angle = np.hypot(u, v), np.arctan2(v, u)
primary = np.maximum(0, np.cos(angle * 19 + .10 * np.sin(r * 5))) ** 24
secondary = np.maximum(0, np.cos(r * 95 + np.sin(angle * 19) * 3)) ** 24
grain = np.fmod(np.sin(x * 12.713 + y * 3.713) * 43758.5453, 1)
q = .91 + .035 * np.sin(angle * 3 + r * 6) - .055 * primary - .012 * secondary + .008 * grain
old_rgb = np.floor(np.minimum(255, q[..., None] * [249, 255, 235])) / 255
target = linear(old_rgb)[r < .98].mean(axis=0) * linear(np.array([96, 126, 59]) / 255)
record = {
    'status': 'same-mean-diffuse-material-comparison',
    'photographicAcceptance': False,
    'imageSize': [width, height],
    'imageSha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'uvDisc': {'centre': [.5, .5], 'radius': .49},
    'atlasMeanLinearRGB': atlas_mean.tolist(),
    'targetMeanLinearRGB': target.tolist(),
    'materialLinearColorGain': (target / atlas_mean).tolist(),
    'normalisationPurpose': 'Hold original effective mean leaf albedo to isolate natural fine venation; not a measured reference reflectance',
    'geometryUnchanged': True,
    'bumpUnchanged': True,
    'lightingUnchanged': True,
    'promptAndOrigin': 'lookdev/lotus03-material96/imagegen-provenance.json',
}
(ASSETS / 'material.json').write_text(json.dumps(record, indent=2) + '\n')
print(json.dumps({'imageSize': record['imageSize'], 'materialLinearColorGain': record['materialLinearColorGain']}))
