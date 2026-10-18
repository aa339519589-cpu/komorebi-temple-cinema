"""Research-only SHARP inference, preserving the official predictor and PLY format.

The image preparation/unprojection below follows Apple's sharp/cli/predict.py
at aed6527499ef91cba3b54c18d49a870f25947190. See upstream LICENSE and
LICENSE_MODEL alongside this file. CUDA-only gsplat rendering is not imported.
"""
from __future__ import annotations

import argparse
import gc
import hashlib
import json
import platform
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def sha256(path: Path) -> str:
    result = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b''):
            result.update(chunk)
    return result.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--id', default='01')
    parser.add_argument('--device', choices=['mps', 'cpu', 'cuda'], default='mps')
    parser.add_argument('--upstream', type=Path, default=Path.home() / '.cache/sharp-study/ml-sharp')
    parser.add_argument('--checkpoint', type=Path, default=Path.home() / '.cache/torch/hub/checkpoints/sharp_2572gikvuh.pt')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(args.upstream / 'src'))
    began = time.monotonic()

    def log(stage: str, **details) -> None:
        print(json.dumps({'stage': stage, 'seconds': round(time.monotonic() - began, 3), **details}), flush=True)

    log('importing')
    import numpy as np
    import torch
    import torch.nn.functional as F
    from sharp.models import PredictorParams, create_predictor
    from sharp.utils.gaussians import save_ply, unproject_gaussians
    from sharp.utils.io import load_rgb

    torch.set_num_threads(8)
    if args.device == 'mps' and not torch.backends.mps.is_available():
        raise RuntimeError('MPS is not available; explicitly rerun with --device cpu.')
    device = torch.device(args.device)
    image, _, f_px = load_rgb(args.image)
    height, width = image.shape[:2]
    f_px = float(f_px)
    log('input-loaded', width=width, height=height, focalPx=f_px, device=str(device))
    log('loading-checkpoint', path=str(args.checkpoint))
    state_dict = torch.load(args.checkpoint, map_location='cpu', weights_only=True, mmap=True)
    log('constructing-predictor')
    predictor = create_predictor(PredictorParams())
    predictor.load_state_dict(state_dict)
    del state_dict
    gc.collect()
    predictor.eval().to(device)
    log('predictor-ready')

    with torch.no_grad():
        internal_shape = (1536, 1536)
        image_pt = torch.from_numpy(image.copy()).float().to(device).permute(2, 0, 1) / 255.0
        disparity_factor = torch.tensor([f_px / width], device=device, dtype=torch.float32)
        resized = F.interpolate(image_pt[None], size=internal_shape, mode='bilinear', align_corners=True)
        log('predicting', internalShape=list(internal_shape))
        gaussians_ndc = predictor(resized, disparity_factor)
        if args.device == 'mps':
            torch.mps.synchronize()
        log('predicted', count=int(gaussians_ndc.mean_vectors.numel() // 3))
        # Official unprojection is affine covariance transformation with a CPU
        # float64 SVD. Keep this whole postprocess on CPU to avoid MPS float64.
        gaussians_ndc = gaussians_ndc.to(torch.device('cpu'))
        del predictor, resized, image_pt, disparity_factor
        gc.collect()
        if args.device == 'mps':
            torch.mps.empty_cache()
        intrinsics = torch.tensor([[f_px, 0, width / 2, 0], [0, f_px, height / 2, 0], [0, 0, 1, 0], [0, 0, 0, 1]], dtype=torch.float32)
        intrinsics_resized = intrinsics.clone()
        intrinsics_resized[0] *= internal_shape[1] / width
        intrinsics_resized[1] *= internal_shape[0] / height
        log('unprojecting-covariances-cpu')
        gaussians = unproject_gaussians(gaussians_ndc, torch.eye(4), intrinsics_resized, internal_shape)
        del gaussians_ndc
        gc.collect()
        ply_path = args.output / f'{args.id}.ply'
        partial = args.output / f'{args.id}.partial.ply'
        log('writing-ply', path=str(ply_path))
        save_ply(gaussians, f_px, (height, width), partial)
        partial.replace(ply_path)

    positions = gaussians.mean_vectors.detach().cpu().numpy().reshape(-1, 3)
    opacity = gaussians.opacities.detach().cpu().numpy().reshape(-1)
    positive_z = positions[:, 2][np.isfinite(positions[:, 2]) & (positions[:, 2] > 0)]
    quantiles = np.quantile(positive_z, [.01, .1, .5, .9, .99]).tolist()
    identity = np.eye(4).reshape(-1).tolist()
    source_commit = subprocess.check_output(['git', '-C', str(args.upstream), 'rev-parse', 'HEAD'], text=True).strip()
    metadata = {
        'id': args.id,
        'model': {'url': f'./{args.id}.ply', 'format': 'binary-ply-gaussian-splat', 'gaussianCount': int(len(positions)), 'sha256': sha256(ply_path)},
        'image': {'path': str(args.image.resolve()), 'width': width, 'height': height, 'sha256': sha256(args.image)},
        'intrinsics': {'fx': f_px, 'fy': f_px, 'cx': width / 2, 'cy': height / 2, 'width': width, 'height': height},
        'coordinateSystem': 'opencv-camera',
        'units': 'metres-predicted-by-single-image-model',
        'sourceCamera': {'cameraToWorld': identity, 'worldToCamera': identity, 'matrixOrder': 'row-major'},
        'gaussianEncoding': {'sphericalHarmonicsDegree': 0, 'color': 'sRGB encoded as SH0: (sRGB-0.5)/sqrt(1/(4*pi))', 'opacity': 'logit', 'scale': 'log principal standard deviation in metres', 'quaternion': 'wxyz'},
        'depth': {'positiveZQuantiles': dict(zip(['p01', 'p10', 'median', 'p90', 'p99'], quantiles)), 'opacityMedian': float(np.median(opacity)), 'boundsMin': positions.min(axis=0).tolist(), 'boundsMax': positions.max(axis=0).tolist()},
        'reconstruction': {'method': 'Apple SHARP unmodified predictor; official fixed 1536x1536 preparation and exact affine covariance unprojection', 'device': str(device), 'postprocess': 'CPU float64 covariance SVD, official implementation', 'source': 'https://github.com/apple-aiml-research/ml-sharp', 'sourceCommit': source_commit, 'checkpointUrl': 'https://ml-site.cdn-apple.com/models/sharp/sharp_2572gikvuh.pt', 'checkpointSha256': sha256(args.checkpoint), 'torch': torch.__version__, 'python': platform.python_version(), 'generatedAt': datetime.now(timezone.utc).isoformat(), 'elapsedSeconds': round(time.monotonic() - began, 3)},
        'license': {'studyUse': 'Non-commercial research evaluation', 'code': 'Apple software license; see LICENSE', 'model': 'Apple Machine Learning Research Model License Agreement; research purposes only; see LICENSE_MODEL', 'attribution': 'Apple Machine Learning Research Model is licensed under the Apple Machine Learning Research Model License Agreement.'},
        'limitations': ['Single input photograph: unseen surfaces and metric scale are inferred, not measured.', 'No full CAD/topological reconstruction or multi-view consistency guarantee.', 'Camera focal length follows official EXIF/default estimate; it is not an independent calibration.']
    }
    (args.output / 'viewer.json').write_text(json.dumps(metadata, indent=2) + '\n')
    log('complete', ply=str(ply_path), metadata=str(args.output / 'viewer.json'), gaussianCount=len(positions), medianDepth=quantiles[2], bytes=ply_path.stat().st_size)


if __name__ == '__main__':
    main()
