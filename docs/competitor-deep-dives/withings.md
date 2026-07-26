# Withings — competitor deep dive

Observed: 2026-07-25  
Research depth: Tier A  
Scope: Withings App, Withings+ and connected scale/watch/sleep/BP devices

## Evidence boundary

Withings has an unusually broad public OpenAPI, already inventoried field by
field in [`withings-public-api.md`](../body-provider-inventory/withings-public-api.md).
Product-only scores and device/region gates remain separate from API proof.

Primary sources:

- Home:
  https://support.withings.com/hc/en-us/articles/39368966174481-Withings-App-Home-tab
- Measurements and trends:
  https://support.withings.com/hc/en-us/articles/202720528-How-can-I-see-my-weight-fat-mass-and-BMI-on-the-Health-Mate-app-
- My Focus:
  https://support.withings.com/hc/en-us/articles/39182232098961-Withings-App-My-Focus
- Vascular Age:
  https://support.withings.com/hc/en-us/articles/8728434029329-Body-Comp-Learn-more-about-Vascular-Age
- Manual entry:
  https://support.withings.com/hc/en-us/articles/205523268-Withings-App-Manually-adding-measurements

## Information architecture

The current app separates:

- Home: alerts, Add Data, health-score cards, My Focus and measurement timeline;
- Measure: complete Heart, Body, Activity and Sleep histories;
- Achieve: programs and content;
- Share: reports and data sharing;
- Health Journal: daily measurement timeline.

My Focus pins/reorders priority biomarkers after at least four measurements.
Tapping any measurement opens its historical detail.

## Measurement system

Withings is strongest at episodic clinical-style measurements:

- weight, BMI and segmental body composition;
- visceral fat, muscle, fat, bone and water estimates;
- blood pressure and HR;
- ECG and rhythm-related device outputs;
- temperature;
- SpO2;
- vascular age/PWV;
- nerve-health score;
- sleep and sleep-apnea related outputs;
- activity/workouts.

The product supports direct device sync, partner imports and manual entry for
blood pressure, calories, period, sleep period, temperature, weight and
activity.

## Trends and body composition

Weight uses a recency-weighted moving trend to suppress day-to-day noise.
Segmental composition can show limb/trunk muscle and fat evolution. This is a
good example of matching the visualization to the physical model rather than
defaulting to one line chart.

Body must retain raw measurements alongside any smoothed trend and label the
smoothing window/version.

## Vascular Age

Compatible scales estimate PWV from cardiac ejection-to-foot pulse timing and
compare it with Withings users of the same age. Output is a range classified as
lower, aligned or higher than chronological age.

The first result requires five successful measurements. Withings documents
measurement-protocol sensitivity, rhythm limitations, EU-only PWV availability
on the referenced product and the fact that the result is a wellness indicator,
not absolute cardiovascular-risk prediction.

This is stronger calibration communication than a single unexplained “heart
age,” but the comparison cohort is Withings users rather than a universal
population.

## Sleep and health scores

Withings Sleep Score uses duration, depth, regularity, interruptions and
overnight cardiovascular signals on compatible products. Product documentation
is not fully consistent about whether it describes four categories or six
inputs, so Body must preserve version/device metadata rather than flattening
them.

Withings+ adds Vitality and Health Improvement Score cards. Health Improvement
Score is a 1–100 aggregate with sub-scores, goals and missions; exact current
weights are not public and have changed across app versions.

## Visual grammar

- latest-measurement timeline;
- pin/reorder My Focus;
- raw points plus smoothed trend;
- body silhouette for segmental composition;
- measurement ranges and comparison bands;
- score plus sub-scores;
- reports designed for clinician/family sharing;
- explicit successful-measurement calibration counts.

## Strengths

- Strong connected-device and measurement breadth.
- Public API is comparatively concrete.
- Excellent body-composition and cardiovascular measurement depth.
- Manual repair and sharing are first-class.
- Trend smoothing is appropriate for noisy weight data.
- Calibration and protocol requirements are often explicit.

## Weaknesses and Body opportunities

- Value fragments across many specialized devices.
- Aggregate scores are subscription-gated and formula-version dependent.
- Same-named features vary by device and region.
- Cohort-relative age metrics can be misread as clinical risk.
- Activity/training depth is weaker than Garmin/Polar/Strava.

Body should adopt measurement provenance, raw-plus-trend views, protocol
guidance, device-specific availability and shareable reports. It must not copy
closed aggregate scores or treat wellness estimates as diagnoses.

## Open evidence tasks

- Resolve score input/version differences per device.
- Validate every device's regional and medical/regulatory classification.
- Verify user/profile attribution for shared household devices.
- Scientifically validate BIA, PWV/vascular age, nerve health and sleep outputs.

