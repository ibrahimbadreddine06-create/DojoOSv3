# Body scientific source inventory

Status: active evidence register  
Started: 2026-07-25  
Purpose: define the scientific source set that must be evaluated before Body
ships calculations, thresholds, interpretations or health claims

## Rule of use

A competitor page can identify a product question, but cannot validate the
answer. A provider algorithm can be displayed as a provider result with
provenance; it cannot become a Body-authored physiological truth merely because
several competitors use it.

Every Body result will ultimately carry:

- the measured or reported inputs;
- source modality and provider;
- formula and version where Body calculates it;
- temporal window;
- applicable population and exclusions;
- evidence class;
- uncertainty and missingness;
- wellness, screening or regulated purpose;
- claim wording permitted by the evidence.

## Evidence classes

| Class | Meaning | Product use |
|---|---|---|
| `G1` | current public-health/clinical guideline or consensus | normative guidance within its stated population |
| `S1` | systematic review/meta-analysis | evidence synthesis, limitations and effect direction |
| `V1` | independent validation against reference standard | device/algorithm accuracy boundary |
| `P1` | peer-reviewed primary study | supporting evidence; rarely enough for a universal threshold |
| `M1` | published measurement/formula standard | reproducible calculation with required protocol |
| `C1` | competitor/provider documentation | product behavior only, not scientific validation |
| `U0` | unsupported or evidence not yet located | no Body-authored health interpretation |

Commercially funded evidence is not automatically rejected, but funding,
device generation, algorithm version, sample and comparator must be visible.

## Activity and sedentary behavior

Primary anchor:

- WHO Guidelines on Physical Activity and Sedentary Behaviour, 2020 (`G1`):
  https://www.who.int/publications/i/item/9789240014886

Validation questions:

- age-specific volume and intensity recommendations;
- pregnancy/postpartum, disability and chronic-condition applicability;
- step-count translation versus minutes of moderate/vigorous activity;
- sedentary bouts versus total sedentary time;
- device-specific step and energy-expenditure error;
- whether a goal is public-health guidance, personalized plan or adherence
  target.

Provisional product boundary: raw steps and active minutes are observations;
“enough activity” requires population and goal context.

## Cardiorespiratory fitness and exercise intensity

Required source families:

- current ACSM exercise-testing/prescription guidance (`G1`);
- validated HR-zone methods and limitations (`M1/S1`);
- VO2 max criterion measurement and wearable-estimate validations (`V1`);
- MET compendium and energy-expenditure limitations (`M1/S1`);
- sport-specific pace/power thresholds (`M1/V1`).

Validation questions:

- measured versus estimated VO2 max;
- HRmax measured versus age-predicted;
- resting-HR and medication effects on reserve methods;
- modality-specific estimation error;
- minimum valid effort/data requirements.

No generic five-zone system will be treated as universal until method and
profile requirements are specified.

## Training load, fatigue and recovery

Seed sources:

- Monitoring Athlete Training Loads: Consensus Statement (`G1`):
  https://pubmed.ncbi.nlm.nih.gov/28463642/
- IOC load and injury-risk consensus (`G1`):
  https://pubmed.ncbi.nlm.nih.gov/27535989/

Required method reviews:

- TRIMP variants;
- session-RPE load;
- power-based Training Stress/impulse-response models;
- acute/chronic averages and EWMA;
- monotony/strain;
- EPOC-derived load;
- musculoskeletal load;
- recovery/readiness validation.

Critical boundary: load monitoring supports context and planning; no single
acute:chronic ratio is an injury prediction. Provider Recovery/Readiness/Strain
scores remain provider results unless an independent reproducible Body model is
scientifically specified.

## Heart rate and HRV

Primary measurement anchor:

- ESC/NASPE HRV measurement and interpretation standard (`M1`):
  https://pubmed.ncbi.nlm.nih.gov/8598068/

Required modern updates:

- short-term versus overnight RMSSD/SDNN comparability;
- ECG versus PPG validation;
- artifact correction and ectopy;
- posture, respiration, time-of-day and recording-duration effects;
- age/sex/training context;
- within-person baseline methods;
- medication, arrhythmia and illness limitations.

Provisional boundary: HRV is not a unitary stress, recovery or vagal-health
score. Raw metric, aggregation method and measurement protocol must remain
visible.

## Sleep

Guideline anchor:

- AASM/SRS adult duration consensus (`G1`):
  https://aasm.org/resources/pdf/adultsleepdurationconsensus.pdf

Validation anchors:

- wearable sleep-staging reliability review (`S1`):
  https://pubmed.ncbi.nlm.nih.gov/38499793/
- actigraphy sleep-stage review (`S1`):
  https://pubmed.ncbi.nlm.nih.gov/38384163/

Required sources:

- age-specific sleep-duration guidance;
- AASM scoring/reference standards;
- sleep regularity, timing and efficiency evidence;
- device-level total-sleep-time and stage validation against PSG;
- nap and sleep-debt models;
- apnea/snoring/SpO2 screening boundaries.

Provisional boundary: consumer wearables can support longitudinal sleep timing
and duration context; stage minutes are estimates and cannot be presented as
clinical PSG-equivalent truth.

## Blood pressure and cardiovascular measurements

Guideline anchor:

- European Society of Hypertension measurement resources (`G1`):
  https://www.eshonline.org/guidelines/blood-pressure-monitoring/

Required sources:

- validated-device registries and cuff protocol;
- home measurement schedules and averaging;
- current European diagnostic/management thresholds;
- ECG/rhythm notification validation and regulatory indications;
- SpO2 reference/device accuracy;
- arterial stiffness/PWV measurement standards;
- resting-HR context.

Provisional boundary: Body may store and visualize readings; diagnosis,
treatment advice and emergency interpretation require the proper regulated
path and jurisdictional specification.

## Anthropometry and body composition

Anchor:

- CDC adult BMI categories and limitations (`G1`):
  https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html

Required sources:

- child/adolescent age- and sex-specific references;
- waist circumference/waist-to-height evidence;
- BIA versus reference-method validation;
- hydration and measurement-protocol effects;
- lean/fat/bone estimate uncertainty;
- pregnancy, edema, athlete and implant/device limitations.

Provisional boundary: BMI is a screening ratio, not body composition or an
individual diagnosis. Consumer BIA trends must retain device and protocol
context.

## Nutrition and hydration

Required guideline/source families:

- EFSA dietary reference values and tolerable upper levels (`G1`);
- WHO healthy-diet and sodium/free-sugar guidance (`G1`);
- validated food composition databases (`M1`);
- energy-requirement equations and population limits (`M1/S1`);
- protein and sport-nutrition consensus by population (`G1/S1`);
- hydration assessment and fluid-replacement consensus (`G1/S1`);
- dietary self-report error (`S1`);
- CGM interpretation for people with and without diabetes (`G1/S1`).

No food-quality, hydration or metabolic-health score ships from an aesthetic
heuristic. Inputs, database version and estimation error must be explicit.

## Stress, mental wellbeing and behavior associations

Required source families:

- validated patient/self-report instruments and licensing conditions;
- physiological-stress construct reviews;
- HR/HRV stress-classification validation;
- ecological momentary assessment methods;
- N-of-1 and repeated-measures association methods;
- confounding, minimum observations and multiple testing.

Provisional boundary: physiological activation, perceived stress and mental
health are distinct. Behavior correlations cannot be phrased causally.

## Menstrual, reproductive and hormonal health

Required source families:

- current professional cycle/ovulation guidance;
- wearable temperature-based cycle validation;
- pregnancy/postpartum exercise and sleep guidance;
- contraception/hormonal-treatment limitations;
- fertility-window accuracy and intended-use boundaries;
- menopause symptom instruments and guidance.

Cycle and fertility estimates need explicit uncertainty and cannot be presented
as contraception unless an appropriately regulated product is implemented.

## Hygiene, looks and routines

This domain needs separate evidence per claim:

- oral-care frequency/technique from dental authorities;
- skin/hair/sun-care guidance from professional bodies;
- personal-care safety and allergy/irritation boundaries;
- routine adherence science;
- condition tracking without diagnostic inference.

User-defined routines may be tracked without a scientific claim. A score or
recommendation requires an identified evidence source and applicable context.

## Wearable measurement-quality layer

Every provider/device metric must be checked for:

- sensor modality and body location;
- sampling/aggregation method;
- firmware and algorithm version;
- reference comparator;
- independent versus manufacturer-funded validation;
- sample size and population diversity;
- error, bias and missingness;
- motion, skin tone, fit, perfusion and environment;
- arrhythmia/medication/clinical exclusions;
- generalization across device generations.

Provider-level accuracy is not inherited by another provider merely because
the canonical field name is the same.

## Next validation pass

The next document will convert this inventory into a metric-family matrix with
one row per intended Body output and these decisions:

1. exact user question;
2. input eligibility;
3. calculation candidate;
4. evidence references;
5. supported population;
6. confidence and uncertainty;
7. allowed language;
8. prohibited interpretation;
9. provider-derived versus Body-derived;
10. production, research-only or rejected.

