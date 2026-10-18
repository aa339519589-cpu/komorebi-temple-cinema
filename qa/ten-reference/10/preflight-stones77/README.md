# Pre-render topology correction

The first CPU build of the newly authored dense boundary failed with a JavaScript heap exhaustion before any GPU render began. `near-rain-stones-oom.js` preserves that source. The attempted reinsertion of collinear boundary vertices could repeatedly subdivide a degenerate face. A subsequent cap build exposed crossing inward offsets at densely sampled corners.

The runtime candidate instead derives bevels, walls and underside from the cap's final shared boundary, uses mitered inner offsets with space around corners, and keeps sparse spalls inside their actual edge segments. The direct model audit accompanies the native-render candidate. This record is not an image candidate or a render receipt.
