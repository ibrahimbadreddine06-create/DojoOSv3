# Widget umbrella specification — Blood Pressure

Status: conditional sensitive observation contract  
Umbrella ID: `hub.blood_pressure`

Question: **What paired blood-pressure measurement was recorded?**

Essential `1×1`: systolic/diastolic pair, date, source/method and state.

Preserve cuff versus cuffless/provider-estimated method and measurement
context. Never separate the pair in storage or interpretation.

Variants: latest pair, same-method trend, measurement list. Initial sizes:
`1×1`, `1×2`, `2×1`, `2×2`. No diagnosis/treatment path without approved
clinical content.

