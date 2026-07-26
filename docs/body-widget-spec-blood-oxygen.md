# Widget umbrella specification — Blood Oxygen

Status: conditional observation contract  
Umbrella ID: `rest.blood_oxygen`

Question: **What oxygen-saturation result did the eligible source record?**

Essential `1×1`: percentage/result, period, source/device and coverage.

Variants: overnight value/range, sample pattern, same-source trend. Initial
sizes: `1×1`, `1×2`, `2×1`, `2×2`.

Consumer readings are not silently treated as clinical measurements. No
diagnosis; detail exposes gaps, device and source semantics.

