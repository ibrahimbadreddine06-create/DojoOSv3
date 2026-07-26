# Huawei Health and Zepp — targeted evidence pass

Status: Tier B targeted product/API pass complete; device/region matrix remains  
Updated: 2026-07-25

## Evidence boundary

This pass uses current first-party consumer and developer material. Available
features vary substantially by device, country and regulatory approval.

## Huawei Health

- Activity rings use Move, Exercise and Stand.
- Health Glance initiates a short multi-measurement session and produces a
  report; possible signals include HR, blood pressure, SpO2, stress, skin
  temperature, ECG, arterial stiffness and pulmonary measures.
- Sleep includes duration, broad stages, naps and improvement guidance.
- Health Insights uses trend summaries and personal-normal alerts.
- Huawei Health Kit exposes read/write scopes for activity, calories, distance,
  heart rate, height/weight, sleep, strength, nutrition, blood glucose,
  pressure, temperature, oxygen saturation, reproductive, stress, heart health
  and pulmonary data, plus activity records and historical-access scopes.

Distinctive lesson: a one-time coordinated measurement report is a different
product from passive background monitoring and from long-term trends.

## Zepp

- PAI reduces heart-rate activity into a personalized rolling activity score.
- Readiness uses sleeping RHR, sleeping HRV, breathing quality and temperature.
- PeakBeats exposes VO2 max, training load/effect and recovery time.
- Zepp App 9 foregrounds daily snapshots, top scores, trends and a personalized
  Exertion target informed by recovery/readiness.
- The ecosystem also connects Sleep Score with optional sleep guidance and
  sound interventions.

Distinctive lesson: activity accumulation, workout-performance analysis,
morning readiness and recommended exertion are separate temporal products.

## Integration implications

- Provider-native composites must retain provider, algorithm version and
  device provenance.
- Capability negotiation must happen per device/region, not merely per brand.
- Read and write permissions are separate and must be requested minimally.
- A supported data scope does not prove that every user's device produces it.

These are integration/research facts, not Body umbrella decisions.

## Remaining evidence tasks

- Full device × region × subscription × regulatory capability matrix.
- API approval, quota, retention, units and null-behavior validation.
- Current direct app captures.
- Independent scientific audit of every composite and interpretation.

## First-party sources

- https://consumer.huawei.com/en/support/content/en-us15952110/
- https://consumer.huawei.com/en/support/content/en-us15952127/
- https://developer.huawei.com/consumer/en/hms/huaweihealth/
- https://developer.huawei.com/consumer/jp/doc/HMSCore-References/scopes-0000001050092713
- https://www.zepp.com/technology
- https://www.zepp.com/press-release/zepp-health-launches-enhanced-zepp-app-9-elevating-personalized-health-and-wellness-for-amazfit-users-worldwide
- https://aura.zepp.com/pages/science
