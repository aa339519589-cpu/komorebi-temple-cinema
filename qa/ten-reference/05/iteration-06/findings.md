# Sixth render: contact-pass corrections

The sixth actual image is rejected for a visibly gray sky and pixel noise. Its contact pass uses real depth/normals, but the offscreen color targets lacked MSAA and the low-sample AO/grain had objectionable high-frequency artifacts. Output tone mapping also converted the formerly display-space sky shader as if it were radiance.

Revision seven uses four-sample offscreen color targets, higher AO and denoise sampling with lower contact intensity, derivative filtering for wood grain, and lower bump amplitude. The analytic sky is converted to radiance before the shared output transform, restoring its intended blue rather than globally recoloring the image. Actual GPU validation is required.
