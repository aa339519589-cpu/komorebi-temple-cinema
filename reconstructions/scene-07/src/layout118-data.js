// Authored landmark fit; bridge was reprojected for the shorter diagonal route in scene-07 iteration 121.
export const layout118={
  "revision": "layout121",
  "imageDimensions": [
    1254,
    1254
  ],
  "reference": "references/hd/6-照片-7.jpg",
  "method": "Manually observed fixed-camera layout landmarks. The bridge span was reprojected to a shorter 31% screen-width diagonal crossing with inferred endpoint elevations and depth; no reference texture or depth projection.",
  "camera": {
    "position": [
      10.7,
      12.8,
      36
    ],
    "target": [
      0,
      7,
      -2
    ],
    "fov": 47
  },
  "landmarks": {
    "railCorner": {
      "pixel": [
        479,
        1005
      ],
      "height": 7.4,
      "world": [
        5.941572034737194,
        7.4,
        24.153506914561575
      ],
      "reprojection": [
        478.9999999999959,
        1005.000000000003
      ]
    },
    "railRightEnd": {
      "pixel": [
        1390,
        1298
      ],
      "height": 7.4,
      "world": [
        13.013293631520195,
        7.4,
        26.812051297164274
      ],
      "reprojection": [
        1390.0000000000016,
        1298.0000000000064
      ]
    },
    "railLeftEnd": {
      "pixel": [
        -180,
        1307
      ],
      "height": 7.4,
      "world": [
        3.7437044242458404,
        7.4,
        29.51663505047591
      ],
      "reprojection": [
        -180.00000000000122,
        1306.9999999999993
      ]
    },
    "bridgeLeft": {
      "pixel": [
        404,
        710
      ],
      "height": 3.8,
      "world": [
        -7.751062679658208,
        3.8000000000000007,
        -4.144178227777289
      ],
      "reprojection": [
        404.00000000000335,
        709.9999999999958
      ]
    },
    "bridgeQuarter": {
      "pixel": [
        470,
        699
      ],
      "height": 4.35,
      "world": [
        -5.3963726810815515,
        4.35,
        -3.7360630159605677
      ],
      "reprojection": [
        470.0000000000028,
        698.9999999999987
      ]
    },
    "bridgeCrown": {
      "pixel": [
        570,
        683
      ],
      "height": 4.85,
      "world": [
        -2.4798549617700036,
        4.849999999999999,
        -4.498181154181999
      ],
      "reprojection": [
        569.9999999999992,
        682.9999999999997
      ]
    },
    "bridgeThreeQuarter": {
      "pixel": [
        675,
        693
      ],
      "height": 4.9,
      "world": [
        0.9901721459789012,
        4.900000000000001,
        -3.5727460226062178
      ],
      "reprojection": [
        674.9999999999993,
        692.9999999999968
      ]
    },
    "bridgeRight": {
      "pixel": [
        795,
        725
      ],
      "height": 4.8,
      "world": [
        4.929876925876182,
        4.800000000000002,
        -0.6670246085918237
      ],
      "reprojection": [
        794.9999999999975,
        724.999999999998
      ]
    }
  },
  "landing": [
    {
      "pixel": [
        653,
        677
      ],
      "world": [
        -1.5176056959663082,
        4,
        -10.647981808523333
      ]
    },
    {
      "pixel": [
        788,
        680
      ],
      "world": [
        2.988650844829319,
        4,
        -11.334291330775194
      ]
    },
    {
      "pixel": [
        810,
        726
      ],
      "world": [
        4.787536499604085,
        4,
        -4.316301005289354
      ]
    },
    {
      "pixel": [
        720,
        732
      ],
      "world": [
        2.474310146787076,
        4,
        -2.844555584431994
      ]
    }
  ]
};

// Shared physical route after actual above-garden inspection. The former
// projected spline crossed beneath the main stair/landing. These authored
// points put the arch in front of that landing; heights retain its observed
// shallow projected rise as closely as the connected 3D layout permits.
export const garden130BridgeKnots=Object.freeze([
 Object.freeze([-7.751062679658208,4.10,-2.0]),
 Object.freeze([-5.3963726810815515,4.65,-1.30]),
 Object.freeze([-2.4798549617700036,5.45,0.0]),
 Object.freeze([.9901721459789012,5.30,1.0]),
 Object.freeze([4.4,4.80,2.0])
]);
