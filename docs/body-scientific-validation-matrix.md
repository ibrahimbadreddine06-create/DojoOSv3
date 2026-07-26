# Body scientific validation matrix

Status: phase C — all initial Body metric families covered  
Updated: 2026-07-25  
Companion: [`body-scientific-source-inventory.md`](body-scientific-source-inventory.md)

## Decision vocabulary

- **Production**: Body may calculate and explain the result.
- **Observation**: show the source value/trend; no normative interpretation.
- **Provider result**: display only with provider, device and formula ownership.
- **Research only**: not user-facing until further validation.
- **Reject**: do not implement in the proposed form.

Confidence describes the evidence for the permitted product use, not whether a
person's specific wearable reading is accurate.

## Activity observations

### Steps

| Decision field | Specification |
|---|---|
| User question | How much ambulatory movement was recorded? |
| Inputs | timestamped provider step deltas or daily totals |
| Calculation | canonical daily sum after source deduplication; never sum overlapping providers |
| Evidence | WHO activity guideline (`G1`); wearable accuracy umbrella review PMID 39080098 (`S1`) |
| Decision | **Production observation** |
| Confidence | High for storage/trend; device-dependent for exact count |
| Allowed language | “Recorded steps”; trend versus the same source/device |
| Prohibited | “True steps”; universal 10,000-step health requirement; cross-device change without source-break marker |
| Requirements | source, device, timezone, coverage window, deduplication status |

Steps are not interchangeable with moderate/vigorous activity minutes. A
provider switch creates a comparability event.

### Active minutes / intensity minutes

| Decision field | Specification |
|---|---|
| User question | How much recorded activity met a defined intensity? |
| Inputs | activity segments plus explicit provider/method intensity classification |
| Calculation | sum non-overlapping duration by method and intensity band |
| Evidence | WHO 2020 guidance (`G1`); wearable intensity error in PMID 39080098 (`S1`) |
| Decision | **Production observation**; guidance only when method maps defensibly to guideline intensity |
| Confidence | Moderate |
| Allowed language | “Device-classified moderate minutes” or “HR-zone minutes” |
| Prohibited | silently mixing provider intensity algorithms; treating all “active minutes” as WHO-equivalent |
| Requirements | method, HR-zone definition where used, valid-wear coverage |

### Sedentary time

| Decision field | Specification |
|---|---|
| User question | How much covered waking time was classified as sedentary? |
| Inputs | posture/inactivity segments, awake window, non-wear |
| Calculation | sum classified segments only within valid coverage |
| Evidence | WHO 2020 guideline (`G1`) |
| Decision | **Observation** until device-specific validation is attached |
| Confidence | Low-to-moderate |
| Allowed language | “Device-classified sedentary time” |
| Prohibited | interpreting non-wear as sedentary; a universal safe maximum |

### Energy expenditure

| Decision field | Specification |
|---|---|
| User question | What energy expenditure did the provider estimate? |
| Inputs | provider active/total energy records |
| Calculation | canonical unit conversion and overlap resolution only |
| Evidence | systematic review PMID 32897239; umbrella review PMID 39080098 |
| Decision | **Provider observation**, not a Body truth |
| Confidence | Low for individual absolute expenditure |
| Allowed language | “Estimated active energy” |
| Prohibited | precise calorie-balance claim; adding BMR twice; combining overlapping provider totals |
| Requirements | active versus total, provider, algorithm/device, coverage |

## Exercise intensity and fitness

### Heart rate during activity

| Decision field | Specification |
|---|---|
| User question | What HR was recorded during this activity? |
| Inputs | timestamped HR with quality/coverage |
| Calculation | duration-weighted summaries; preserve raw samples where licensed |
| Evidence | INTERLIVE HR validation protocol PMID 33397674; skin-tone review PMID 36376641 |
| Decision | **Production observation** |
| Confidence | Moderate-to-high at rest/steady exercise; device/activity dependent |
| Allowed language | “Recorded HR”, average, peak with coverage |
| Prohibited | medical rhythm interpretation from ordinary PPG; hiding data gaps |

### Heart-rate zones

| Decision field | Specification |
|---|---|
| User question | How was exercise time distributed across a chosen HR-intensity model? |
| Inputs | HR samples, selected model, HRmax/resting HR where required |
| Calculation | deterministic assignment under a named/versioned model |
| Evidence | pending current ACSM source; INTERLIVE measurement boundary |
| Decision | **Production only with explicit model** |
| Confidence | Moderate |
| Allowed language | “Time in zone under [model]” |
| Prohibited | one universal five-zone truth; age-predicted HRmax presented as measured |
| Requirements | zone model, thresholds, profile inputs, override history |

### VO2 max / cardio fitness

| Decision field | Specification |
|---|---|
| User question | What aerobic-capacity value was measured or estimated, and how is it changing? |
| Inputs | laboratory measurement, provider estimate or validated field |
| Calculation | Body does not synthesize an estimate in phase A |
| Evidence | INTERLIVE meta-analysis PMID 35072942 |
| Decision | lab value: **Observation**; wearable: **Provider result** |
| Confidence | High for correctly conducted lab result; moderate/low individual wearable estimate |
| Allowed language | “Estimated VO2 max by Garmin”; same-source trend |
| Prohibited | dropping “estimated”; mixing resting- and exercise-derived estimates as equivalent; diagnosis |
| Requirements | modality, provider, date, units, estimate/measurement distinction |

The INTERLIVE review found smaller average bias for exercise-based algorithms
but wide individual limits. Therefore Body may emphasize trends without hiding
absolute uncertainty.

## Training load

### Session duration × RPE (sRPE)

| Decision field | Specification |
|---|---|
| User question | How demanding did this complete session feel relative to its duration? |
| Inputs | session duration in minutes; post-session CR-10 RPE |
| Calculation | `session_load_au = duration_minutes × rpe_cr10` |
| Evidence | review PMID 29163016; resistance RPE review PMID 35000021 |
| Decision | **Production** |
| Confidence | Moderate |
| Allowed language | “Perceived session load (AU)” |
| Prohibited | calling it mechanical load, injury risk or calories |
| Requirements | scale, collection time, duration, manual/source label |

The result is an arbitrary-unit monitoring tool. It remains valuable as the
wearable-free fallback and for modalities where HR poorly captures demand.

### TRIMP / cardio load

| Decision field | Specification |
|---|---|
| User question | What internal cardiovascular load did this session create under a named model? |
| Inputs | HR time series, duration, profile values required by chosen TRIMP variant |
| Calculation | deferred until one exact variant and population boundary are selected |
| Evidence | athlete-load consensus PMID 28463642; formula-specific review pending |
| Decision | provider value: **Provider result**; Body formula: **Research only** |
| Confidence | Model-dependent |
| Prohibited | generic “TRIMP” without formula; comparing unlike variants |

### Acute and chronic load

| Decision field | Specification |
|---|---|
| User question | How does recent load compare with the person's longer training history? |
| Inputs | one internally consistent daily load series |
| Calculation | show separate short- and long-window series; exact window/model versioned |
| Evidence | load consensus PMID 28463642; ACWR critique PMID 32502973 |
| Decision | separate trends: **Production**; causal ratio guidance: **Reject** |
| Confidence | Moderate for descriptive load context |
| Allowed language | “Recent load is above your recent baseline” |
| Prohibited | injury probability; “safe zone” from a ratio; causal overtraining claim |

### Acute:chronic workload ratio as injury predictor

**Rejected.** The conceptual critique (PMID 32502973) identifies causal,
mathematical and interpretive problems and concludes that evidence does not
support ACWR-based injury-reduction recommendations. Later heterogeneous
association reviews do not establish a causal personal prediction.

### Muscular load

| Decision field | Specification |
|---|---|
| User question | What external and perceived resistance-training work was performed? |
| Inputs | exercises, sets, reps, load, tempo/range when available, RIR/RPE |
| Calculation | volume and exercise-specific summaries; no universal muscular-strain score in phase A |
| Evidence | resistance RPE reviews PMID 35000021 and 38910451 |
| Decision | components: **Production**; universal score: **Research only** |
| Prohibited | infer muscular load from HR alone; compare kilograms across unlike exercises as physiological equivalence |

## Resting physiology and recovery

### Resting heart rate

| Decision field | Specification |
|---|---|
| User question | How does resting HR compare with the person's established baseline? |
| Inputs | provider RHR with method/time context or standardized resting sample |
| Calculation | same-source robust baseline; window to be validated |
| Evidence | wearable HR evidence PMID 33397674; clinical interpretation sources pending |
| Decision | **Production observation** |
| Confidence | Moderate-to-high with consistent protocol |
| Allowed language | “Above your 28-day baseline” |
| Prohibited | cause attribution; universal recovery score from RHR alone |

### HRV / RMSSD

| Decision field | Specification |
|---|---|
| User question | How does a consistently measured HRV metric compare with the person's own baseline? |
| Inputs | same HRV metric, position/time window, valid NN intervals and artifact handling |
| Calculation | no cross-metric conversion; log transform may be used only in a documented Body model |
| Evidence | ESC/NASPE standard PMID 8598068; wearable method evaluation PMID 37867933 |
| Decision | **Production observation**; composite recovery inference deferred |
| Confidence | Moderate under repeatable measurement conditions |
| Allowed language | “Nightly RMSSD is below your personal baseline” |
| Prohibited | “low HRV means stress/illness”; compare provider SDNN with another provider RMSSD; population leaderboard |
| Requirements | metric type, aggregation, sensor, period, artifacts/quality, baseline eligibility |

### Respiratory rate and skin temperature deviation

| Decision field | Specification |
|---|---|
| User question | Is the provider-recorded overnight value unusual for this person? |
| Inputs | provider nightly RR or temperature deviation |
| Calculation | same-source trend/baseline only in phase A |
| Decision | **Provider observation** |
| Confidence | device-dependent |
| Allowed language | “Higher than your usual range” |
| Prohibited | illness detection, fever equivalence or cause attribution without regulated evidence |

### Readiness / recovery score

| Decision field | Specification |
|---|---|
| User question | What does a provider's readiness result say, or can Body build a defensible alternative? |
| Inputs | provider score and contributors |
| Calculation | no Body composite in phase A |
| Evidence | competitor documentation only (`C1`) for proprietary scores |
| Decision | provider score: **Provider result**; Body score: **Research only** |
| Allowed language | provider-owned name, result and documented contributors |
| Prohibited | comparing different provider scores as the same scale; reverse engineering weights; claim of injury/illness prediction |

Body may later build a transparent multi-component status, but only after
prospective validation. Until then, individual signals and provider scores
remain separate.

## Sleep

### Sleep interval and total sleep time

| Decision field | Specification |
|---|---|
| User question | When and how long did the source estimate that the person slept? |
| Inputs | sleep sessions, awake intervals, naps, source confidence |
| Calculation | normalize timezone; resolve overlaps; preserve edited/original records |
| Evidence | AASM/SRS duration consensus; 2025 wearable meta-analysis PMID 39484805 |
| Decision | **Production observation** |
| Confidence | Moderate for longitudinal pattern; not PSG-equivalent |
| Allowed language | “Wearable-estimated sleep” and same-source trend |
| Prohibited | exact clinical sleep time; merging overlapping providers by averaging |

### Adult sleep-duration guidance

| Decision field | Specification |
|---|---|
| User question | Is habitual adult sleep duration below the evidence-based minimum? |
| Inputs | valid repeated sleep duration; adult profile |
| Rule | regular sleep of at least seven hours for healthy adults, contextualized rather than one-night judged |
| Evidence | AASM/SRS consensus DOI 10.5664/jcsm.4758 |
| Decision | **Production guidance for stated adult population** |
| Prohibited | declaring >9h harmful; applying adult rule to children; diagnosing a disorder |

### Sleep consistency

| Decision field | Specification |
|---|---|
| User question | How stable are sleep onset and wake times? |
| Inputs | valid main-sleep onset/offset across eligible days |
| Calculation | descriptive variability first; threshold scoring deferred |
| Evidence | NSF consensus PMID 37684151 |
| Decision | descriptive metric: **Production**; normative score: **Research only** |
| Allowed language | standard deviation/range and trend |
| Prohibited | one universal optimal variability threshold without validation |

### Sleep efficiency

| Decision field | Specification |
|---|---|
| User question | What fraction of the detected in-bed interval was estimated asleep? |
| Inputs | total sleep time and time in bed from the same source/session |
| Calculation | `sleep_efficiency_pct = total_sleep_minutes / time_in_bed_minutes × 100` |
| Decision | **Production observation** |
| Confidence | Moderate/low from consumer wrist devices |
| Prohibited | clinical interpretation without source-specific validity |

### Sleep stages

| Decision field | Specification |
|---|---|
| User question | What stages did the wearable algorithm estimate? |
| Inputs | provider stage segments |
| Calculation | duration by provider stage vocabulary; no cross-provider “correction” |
| Evidence | reviews PMID 38499793, 38384163 and 39484805 |
| Decision | **Provider observation** |
| Confidence | Low-to-moderate, stage/device/population dependent |
| Allowed language | “Estimated REM/Deep by [device]” |
| Prohibited | clinical PSG equivalence; precise stage prescriptions; averaging stages across devices |

### Sleep debt / sleep need

| Decision field | Specification |
|---|---|
| User question | How much sleep opportunity may be needed after recent short sleep? |
| Inputs | requires a validated personal-need model |
| Evidence | insufficient for one universal consumer formula in current register |
| Decision | provider values: **Provider result**; Body formula: **Research only** |
| Prohibited | simple cumulative subtraction presented as biological debt |

### Sleep score

| Decision field | Specification |
|---|---|
| User question | Can one number summarize sleep without hiding uncertainty? |
| Evidence | proprietary competitor models; wearable error and multidimensional sleep evidence |
| Decision | provider score: **Provider result**; Body score: **Research only** |
| Rationale | duration, timing, regularity, continuity and subjective quality are distinct; stage estimates add device error |

## Cross-cutting production rules from phase A

1. The canonical model preserves raw/provider values; derived values never
   overwrite them.
2. Provider scores remain namespaced.
3. Cross-provider trend continuity is not assumed.
4. Every baseline requires a minimum-valid-data rule and source consistency.
5. Missing, non-wear, unsupported, permission-denied and not-yet-calibrated are
   distinct states.
6. A chart can show a trend with lower confidence than a threshold claim.
7. Wearable estimates use “estimated” or “device-recorded” language.
8. No causal explanation is generated from temporal association alone.
9. One-day anomalies do not become diagnoses.
10. Age, sex, pregnancy, medication, health condition and device limitations
    are applied only when supported and required by the metric.

## Cardiovascular and medical-adjacent measurements

### Blood pressure reading

| Decision field | Specification |
|---|---|
| User question | What validated device reading was recorded, and what is the repeated home average? |
| Inputs | systolic, diastolic, measurement time, posture/protocol, device, context |
| Calculation | preserve readings; calculate period average only from an eligible home-measurement protocol |
| Evidence | 2024 ESC hypertension guideline DOI 10.1093/eurheartj/ehae178 |
| Decision | readings/trend: **Production observation**; diagnostic classification: controlled clinical path only |
| Confidence | High for validated cuff under proper protocol; not inherited by cuffless estimates |
| Allowed language | “Home BP average”; contextual guideline category with jurisdiction/version |
| Prohibited | diagnosis from one reading; mixing office/home/ambulatory thresholds; medication advice |
| Requirements | validated device status, cuff/position protocol, repeated measurements, jurisdiction |

For European adult context, the 2024 ESC guideline uses a home average of
135/85 mmHg or higher for hypertension, distinct from office thresholds. Body
will not globally hard-code that number: classification is a versioned,
jurisdictional interpretation layer.

### Cuffless or wearable-estimated blood pressure

| Decision field | Specification |
|---|---|
| User question | What range did the provider estimate? |
| Inputs | provider output plus calibration/device metadata |
| Decision | **Provider result** only when legally available |
| Confidence | device/model dependent |
| Prohibited | substituting it for validated cuff measurement; diagnosing hypertension; hiding calibration |

### SpO2

| Decision field | Specification |
|---|---|
| User question | What oxygen-saturation value did the device estimate? |
| Inputs | spot or overnight provider SpO2, signal quality and coverage |
| Evidence | umbrella review PMID 39080098; skin-pigmentation meta-analysis PMID 39388258 |
| Decision | general consumer device: **Provider observation**; regulated device follows its intended use |
| Confidence | device/population/perfusion dependent |
| Allowed language | “Device-estimated SpO2” |
| Prohibited | ruling out respiratory disease; apnea diagnosis from a generic wearable; emergency reassurance |
| Requirements | device intended use, motion/perfusion context, skin-pigmentation limitation, coverage |

### ECG and irregular-rhythm notification

| Decision field | Specification |
|---|---|
| User question | What regulated recording/classification did the approved device produce? |
| Inputs | original waveform/file where authorized; provider classification; symptoms/context |
| Decision | **Provider result under regulated intended use** |
| Allowed language | exact approved provider wording and next-step instructions |
| Prohibited | Body reinterpreting the ECG; broadening supported age/region/rhythm; replacing medical review |
| Requirements | device, region, age, regulatory version, inconclusive state |

### Pulse-wave velocity / vascular age

| Decision field | Specification |
|---|---|
| User question | What did the compatible provider estimate about arterial stiffness or cohort-relative age? |
| Inputs | provider PWV/vascular-age result and protocol |
| Decision | PWV: **Provider observation**; vascular age: **Provider result** |
| Confidence | device/protocol dependent |
| Prohibited | absolute cardiovascular-risk prediction; cross-provider age comparison; Body-derived age formula in phase B |

## Anthropometry and body composition

### Weight

| Decision field | Specification |
|---|---|
| User question | What is the current measured weight and underlying trend? |
| Inputs | attributed scale/manual measurements, units, device/source |
| Calculation | raw series plus versioned robust trend; no destructive smoothing |
| Decision | **Production** |
| Confidence | High with calibrated scale and correct user attribution |
| Allowed language | measured value, change and trend |
| Prohibited | interpreting a short fluctuation as fat/muscle change |
| Requirements | household-user attribution, pregnancy/context flag, source-break handling |

### BMI

| Decision field | Specification |
|---|---|
| User question | What is weight relative to squared height as a screening ratio? |
| Inputs | current weight kg; height m; adult/child context |
| Calculation | `BMI = weight_kg / height_m²` |
| Evidence | CDC adult BMI categories and limitations (`G1`) |
| Decision | **Production screening metric** |
| Confidence | High for calculation, limited for individual body composition |
| Allowed language | “BMI screening category” |
| Prohibited | diagnosis; body-fat equivalence; adult cutoffs for children; moral/value language |

### Consumer BIA body fat, lean mass, muscle and water

| Decision field | Specification |
|---|---|
| User question | What composition did this device estimate, and is the same-protocol trend stable? |
| Inputs | provider result, model, measurement protocol, weight, hydration/context |
| Evidence | 4-compartment review PMID 41718193; smartwatch studies PMID 35883219 and 41341278 |
| Decision | **Provider observation** |
| Confidence | Moderate/low by component and individual |
| Allowed language | “Estimated body fat by [device]”; same-device trend |
| Prohibited | DXA equivalence; mixing devices; interpreting small changes below repeatability; medical diagnosis |
| Requirements | device, protocol adherence, same time/conditions where possible, uncertainty note |

The 2025 smartwatch study found strong correlation but material individual
error and weak agreement for skeletal-muscle percentage. Correlation therefore
does not justify precise individual composition claims.

### Body-composition change

Body displays a change only when:

- source/device and measurement protocol are comparable;
- sufficient repeated measurements exist;
- the change exceeds the device's known or empirically observed repeatability
  noise;
- raw weight and context remain available.

Otherwise it shows the measurements without labeling a meaningful gain/loss.

## Nutrition

### Food and nutrient intake

| Decision field | Specification |
|---|---|
| User question | What food and nutrients were logged? |
| Inputs | food identity, quantity, preparation, database entry/version, user edits |
| Calculation | sum nutrient composition with uncertainty/provenance |
| Evidence | EFSA DRV programme; WHO Healthy Diet 2026 |
| Decision | **Production observation** |
| Confidence | database and logging-quality dependent |
| Allowed language | “Logged intake”; coverage/completeness |
| Prohibited | “actual intake” when logging is incomplete; invented nutrient values; causal health judgement |
| Requirements | database provenance, serving units, recipe decomposition, incomplete-day state |

### Energy intake and energy balance

| Decision field | Specification |
|---|---|
| User question | What energy was logged, and how does it compare with a clearly identified estimate? |
| Inputs | logged food energy; measured/estimated expenditure kept separate |
| Decision | logged intake: **Production observation**; precise energy balance: **Reject** |
| Rationale | both dietary self-report and wearable expenditure contain substantial error |
| Allowed language | “Logged energy” and long-term weight trend |
| Prohibited | exact daily surplus/deficit as physiological truth; predicted tissue change from one day |

### Dietary reference values

| Decision field | Specification |
|---|---|
| User question | How does logged intake compare with an applicable reference? |
| Inputs | age, sex, pregnancy/lactation where required; nutrient intake coverage |
| Evidence | EFSA Dietary Reference Values (`G1`): https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values |
| Decision | **Production guidance** only per exact EFSA reference type/population |
| Prohibited | treating an average requirement, adequate intake, reference intake and upper level as interchangeable |
| Requirements | nutrient, DRV type, population, unit, source/version |

### WHO population healthy-diet indicators

Body may calculate transparent logged-intake checks where the input is
sufficient:

- fruit and vegetables: 400 g/day for people older than ten;
- naturally occurring dietary fibre: at least 25 g/day for people older than
  ten;
- free sugars: below 10% of total energy, with 5% as possible additional
  benefit;
- adult sodium: below 2,000 mg/day, equivalent to below 5 g salt.

Source: WHO Healthy Diet, updated 2026:
https://www.who.int/news-room/fact-sheets/detail/healthy-diet

These are population-health references, not a universal personalized meal plan.
Children, pregnancy, disease, medication and renal/potassium contexts require
the applicable guidance.

### Nutrition quality score

**Research only.** Body will not invent one opaque “nutrition score.” The
production alternative is a transparent set of adequacy, balance, moderation
and diversity indicators, each with source, coverage and limitations.

## Hydration

### Water/fluid logged

| Decision field | Specification |
|---|---|
| User question | How much fluid was logged? |
| Inputs | beverage/food water, volume, timestamp; completeness |
| Calculation | transparent volume totals; distinguish plain water from total fluid |
| Evidence | EFSA water DRVs; hydration-method reviews PMID 33126891 and 40225416 |
| Decision | **Production observation** |
| Confidence | logging completeness dependent |
| Prohibited | declaring hydration status from intake alone |

### Hydration status

| Decision field | Specification |
|---|---|
| User question | Is there sufficient evidence that the person is hypo/euhyperhydrated? |
| Inputs | would require context-specific combination of body-mass change, urine concentration, thirst and clinical/environmental factors |
| Evidence | reviews PMID 33126891 and 40225416 |
| Decision | generic consumer score: **Reject** |
| Rationale | no single field measure is a universal gold standard; water shifts and context matter |

### Exercise fluid replacement

| Decision field | Specification |
|---|---|
| User question | What personalized replacement plan is appropriate around this activity? |
| Inputs | pre/post body mass under protocol, intake/output, duration, environment, sweat context |
| Evidence | NATA position statement PMID 28985128 |
| Decision | **Research/advanced workflow** until protocol and safety checks are complete |
| Prohibited | fixed “drink X per hour” for everyone; encouraging overdrinking; ignoring hyponatremia risk |

## Stress, mood and behavior associations

### Perceived stress / mood check-in

| Decision field | Specification |
|---|---|
| User question | How did the person report feeling at that moment? |
| Inputs | timestamped self-report using plain scale or licensed validated instrument |
| Evidence | EMA review PMID 35895674; wellbeing EMA review PMID 34720691 |
| Decision | **Production observation** |
| Confidence | Direct for the person's report, not a diagnosis |
| Allowed language | “You reported…”; trends and context |
| Prohibited | inferring a mental disorder; changing scale meaning; comparing unlike instruments |
| Requirements | instrument/version, recall window, licensing, missingness |

### Wearable physiological stress

| Decision field | Specification |
|---|---|
| User question | What physiological activation did the provider algorithm classify? |
| Inputs | provider result, HR/HRV/EDA/motion where available |
| Evidence | EMA physiology review PMID 35895674; EDA review PMID 36960675 |
| Decision | **Provider result** |
| Confidence | Context/model dependent |
| Allowed language | “Physiological stress estimated by [provider]” |
| Prohibited | equating it with perceived/psychological stress; cause attribution; mental-health diagnosis |

Physiology and subjective experience may disagree legitimately. Body shows them
as separate dimensions and can invite a short check-in rather than calling one
of them wrong.

### Body-authored stress score

**Rejected for initial production.** Real-world associations between subjective
stress and physiological responses are heterogeneous and strongly moderated.
A universal HR/HRV/EDA formula would overstate what the evidence supports.

### Behavior/outcome association

| Decision field | Specification |
|---|---|
| User question | Is a repeatedly logged behavior associated with a later personal outcome? |
| Inputs | timestamped exposure, outcome, covariates, sufficient exposed/unexposed observations |
| Calculation | preregistered/versioned within-person analysis; minimum sample and confounding checks |
| Evidence | EMA review PMID 35895674; mHealth self-report review PMID 36083606 |
| Decision | **Research/experimental insight** until the method passes validation |
| Allowed language | “Associated in your logged data” with effect/uncertainty |
| Prohibited | “caused”, “improves”, or “harms”; insight when behaviors always co-occur; hidden multiple testing |

## Menstrual and reproductive health

### Period and symptom logging

| Decision field | Specification |
|---|---|
| User question | What bleeding, symptoms and contextual events were logged? |
| Inputs | user entries, optionally provider imports |
| Decision | **Production observation** |
| Confidence | Direct for reported events |
| Allowed language | logged cycle length, variability and symptom history |
| Prohibited | diagnosis from logs; assuming missing entry means no symptom/bleeding |
| Requirements | privacy class, edit history, timezone, hormone/contraception context |

### Cycle projection

| Decision field | Specification |
|---|---|
| User question | Based on prior logged cycles, when might the next period occur? |
| Inputs | sufficient valid cycle-start history, exclusions/context |
| Calculation | transparent interval estimate, not a single certain date |
| Decision | **Production estimate** after algorithm validation |
| Allowed language | predicted window and uncertainty |
| Prohibited | certainty; applying unchanged through pregnancy/postpartum or major hormone changes |

### Wearable fertile-window / ovulation estimate

| Decision field | Specification |
|---|---|
| User question | What did a validated provider/device estimate about the fertile window? |
| Inputs | provider estimate and contributing temperature/physiology only where authorized |
| Evidence | reviews PMID 38358798 and 41580499 |
| Decision | **Provider result**; Body-authored algorithm remains **Research only** |
| Confidence | Promising but device/algorithm/population dependent |
| Allowed language | estimated fertile window for planning/context |
| Prohibited | contraception claim; guaranteed ovulation; generalizing study/device accuracy |

The 2026 meta-analysis reports pooled performance but material uncertainty and
heterogeneity. A wellness fertile-window estimate is not a contraceptive
method. Hormonal contraception/treatment, irregular cycles, perimenopause,
pregnancy and postpartum require explicit applicability rules.

### Pregnancy, postpartum and menopause

Initial decision: tracking and provider-imported observations are
**Production**; Body-authored physiological guidance is deferred until
population-specific professional guidelines are attached. General adult
activity, nutrition, temperature and weight interpretations must not silently
apply to these states.

## Hygiene and looks

### User-defined routine

| Decision field | Specification |
|---|---|
| User question | Did the person complete the routine they intentionally configured? |
| Inputs | routine definition, schedule, completion/skip/edit |
| Calculation | transparent adherence/completion; planned and actual remain distinct |
| Decision | **Production** |
| Confidence | Direct for recorded adherence |
| Allowed language | completion, streak with grace/missing semantics, consistency trend |
| Prohibited | calling a self-created routine healthy, necessary or effective without evidence |

Everything can be placed in the routine/element system; scientific
interpretation is attached only to a specific claim, not to the freedom to
track it.

### Oral-care template

Body may offer an evidence-labelled default template, customizable by the user:

- brush twice daily;
- two minutes;
- fluoride toothpaste;
- clean between teeth daily.

Sources:

- ADA toothbrush guidance:
  https://www.ada.org/resources/ada-library/oral-health-topics/toothbrushes
- ADA home oral care:
  https://www.ada.org/resources/ada-library/oral-health-topics/home-oral-care/
- ADA interdental cleaning:
  https://www.ada.org/resources/ada-library/oral-health-topics/floss

Decision: **Production guidance**, with age/caregiver and dentist-personalized
exceptions. Completion tracking does not prove technique or clinical outcome.

### Sun-protection template

Body may present context-sensitive guidance from the American Academy of
Dermatology to choose broad-spectrum, water-resistant SPF 30+ sunscreen:
https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/choosing-right-sunscreen

Decision: **Production educational guidance** after localization and UV/context
workflow review. Body must not diagnose lesions or recommend treatment.

### Skin, hair, dental, posture or appearance condition tracking

| Decision field | Specification |
|---|---|
| User question | How did a user-described observation change over time? |
| Inputs | private note, rating, photo with consent, routine/products and context |
| Decision | **Production tracking**, no automated diagnosis |
| Allowed language | “You recorded…” and neutral change comparison |
| Prohibited | disease identification, attractiveness score, unvalidated image diagnosis, guaranteed treatment result |

Any image comparison must control capture conditions where possible and clearly
state that lighting, angle, camera and skin appearance can create false change.

## Adherence and habit formation

| Decision field | Specification |
|---|---|
| User question | Is execution becoming more consistent? |
| Inputs | intended schedule and actual completion |
| Evidence | habit meta-analysis PMID 39685110; adherence review PMID 35612886 |
| Decision | adherence metrics: **Production**; automatic “habit formed” date: **Reject** |
| Rationale | habit-formation time varies widely (reported range 4–335 days); completion is not automaticity |

Body can support personalized reminders, planning and feedback, but does not
claim a universal 21-, 30- or 66-day habit threshold.

## Age, sex and contextual applicability

1. Age-specific pediatric rules replace adult thresholds; they are not scaled
   adult rules.
2. Sex assigned at birth is requested only where a calculation or physiological
   reference requires it, with purpose disclosed.
3. Menstrual/pregnancy/postpartum/menopause state is opt-in sensitive data.
4. Medication, diagnosed conditions and implants affect only metrics with an
   evidenced applicability rule.
5. A missing profile field yields “not calculable,” never a guessed default.
6. Body avoids multiplying widget catalogues unnecessarily: the same umbrella
   may adapt its calculation/context when scientifically required.

## Risk communication and accessibility

Every interpreted result must support:

- plain-language result and unit;
- data source and recency;
- measured, estimated, logged or calculated label;
- reference and applicable population;
- uncertainty/missing coverage;
- “what this does not mean” for higher-risk metrics;
- non-color status label and accessible chart/table equivalent;
- regional emergency/clinical wording only through an approved content path.

Color never carries the only meaning. A score without a readable explanation
and an accessible underlying value cannot ship.

## Initial scientific disposition summary

### Reproducible Body calculations

- unit conversion and non-overlapping aggregation;
- BMI with screening limitations;
- sleep efficiency;
- sRPE session load;
- descriptive sleep timing/regularity;
- transparent logged nutrient/reference comparisons;
- routine adherence;
- raw and robust same-source trends.

### Provider-namespaced results

- readiness/recovery/energy scores;
- proprietary sleep/activity/stress scores;
- wearable VO2 max;
- physiological stress;
- sleep stages;
- BIA composition;
- cuffless BP;
- vascular age;
- fertile-window/ovulation estimates;
- regulated ECG/rhythm outputs.

### Rejected initial claims/models

- ACWR injury prediction or universal safe zone;
- exact wearable calorie balance;
- universal hydration score;
- HRV-only stress/recovery diagnosis;
- one opaque nutrition score;
- one Body readiness or sleep score without prospective validation;
- consumer sleep stages as PSG truth;
- universal habit-formation countdown;
- fertility prediction as contraception;
- image-based medical or appearance diagnosis.

## Remaining scientific work

- attach current primary/professional sources to every advanced exercise and
  population-specific rule;
- validate exact baseline/window algorithms prospectively;
- create formula-version test vectors;
- complete legal/regulatory review of medical-adjacent features;
- review content with qualified domain professionals before launch.
