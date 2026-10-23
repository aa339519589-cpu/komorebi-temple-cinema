// One common physical perspective and five-bay bearing frame.
// Scene02 joint measurement in qa/ten-reference/02/iteration-scene02-coupled-hall-fit-19-20261021.
// Reference pixels are comparison targets only; no image projection or replacement surface.
export const layout = {
  "referenceCamera": {
    "position": [
      16.2,
      2.72,
      25
    ],
    "target": [
      -1,
      4.7,
      -7
    ],
    "fov": 52,
    "status": "retained after joint bridge-rail-canopy and architecture perspective measurement"
  },
  "pagoda": {
    "position": [
      -15.653576564399296,
      5.546551778040175,
      -15.842052933340328
    ],
    "scale": [
      0.8415755399530989,
      1.1716825470849022,
      0.8415755399530989
    ],
    "yaw": -0.27345374939230405,
    "tierPitch": 2.2489289368170575,
    "sorinYOffset": -1.6042842527317696
  },
  "hall": {
    "position": [
      2.839658826218076,
      3.0863624109860766,
      -12.131012899660618
    ],
    "scale": [
      0.5520987933515367,
      0.82830156825908,
      0.6800433430239969
    ],
    "yaw": -0.27308984315941026,
    "roofWidth": 24.22166337497416,
    "roofFront": 10.434156133089864,
    "roofBack": -10.063530526328192,
    "gableWidth": 17.486548200101787,
    "gableFront": 6.402000727072713,
    "gableEave": 10.431202802556143,
    "gableRise": 5.182892419189324,
    "gableCenterX": 0.2178671588808961,
    "roofEave": 8.91075912537992,
    "roofCurl": 0.6999999861012436,
    "ridgeY": 15.614095221745467,
    "gableBack": -5.2341319948794975,
    "bearingGrid": {
      "centre": 0.2178671588808961,
      "span": 15.209753784816835,
      "bayCount": 5,
      "axes": [
        -7.387009733527521,
        -4.345058976564154,
        -1.3031082196007873,
        1.7388425373625802,
        4.780793294325947,
        7.822744051289313
      ],
      "frontZ": 4.7
    },
    "structuralModel": "scene02-common-five-bay-bearing-grid-and-connected-hip-gable154"
  },
  "bridge": {
    "position": [
      0.7141701002288093,
      0.5409749285582757,
      5.003940245477229
    ],
    "scale": [
      0.6600000000000000,
      1,
      0.9908705507107833
    ],
    "yaw": 0.32033821361977904,
    "archRise": 1.2298124849745464,
    "slope": 0.33558844670183235,
    "railHeights": {
      "finialTop": 1.05,
      "handrail": 0.65
    }
  },
  "rail": {
    "posts": [
      [
        15.193872543879204,
        1.3671515944498158,
        23.368270846691118
      ],
      [
        15.301670941934049,
        1.4359151386049729,
        22.03832476365354
      ],
      [
        15.586114982218282,
        1.4116018838120357,
        19.442761528529996
      ]
    ],
    "postHeight": 1.12,
    "capToRail": 0.24
  },
  "canopy": {
    "entryPixel": [
      410,
      0
    ],
    "farPixel": [
      1185,
      370
    ],
    "entryWorld": [
      9.04793668,
      9.08,
      15.88197293
    ],
    "farWorld": [
      14.06544729,
      9.08,
      -1.92406785
    ],
    "columnX": 16.25,
    "zRange": [
      -2,
      41
    ],
    "method": "Fixed-height inverse rays recover a continuous tapered roof footprint from two visible envelope points."
  },
  "hangingLamps": [
    {
      "position": [
        13.82247878,
        6.1,
        15.63839394
      ],
      "scale": 0.77,
      "bodyCentroidPixel": [
        942,
        241
      ]
    },
    {
      "position": [
        14.22723456,
        7.25,
        4.53250692
      ],
      "scale": 0.48,
      "bodyCentroidPixel": [
        1160,
        393
      ]
    }
  ],
  "sunDirection": [
    -0.7481226270926461,
    0.2010196779198914,
    -0.632379335463281
  ]
};
