# Apple HealthKit — datatypeinventaris

Status: **publieke datatypecatalogus compleet; veld-/OS-gates per type nog te finaliseren**

Primaire bronnen:

- Data types: https://developer.apple.com/documentation/healthkit/data-types
- Officiële DocC-data: https://developer.apple.com/tutorials/data/documentation/healthkit/data-types.json
- Nutrition identifiers: https://developer.apple.com/documentation/healthkit/nutrition-type-identifiers
- Symptom identifiers: https://developer.apple.com/documentation/healthkit/symptom-type-identifiers

## Integratieroute

HealthKit is een native Apple-platform store. Een webapp kan HealthKit niet
rechtstreeks als browser-API gebruiken. Body heeft een native iOS-app of native
bridge nodig, met een usage description en afzonderlijke read/share-autorisatie
voor ieder gevraagd type.

## Objectvormen

- `HKCharacteristicType`: relatief stabiele profielkenmerken.
- `HKQuantityType`: numerieke samples.
- `HKCategoryType`: categorische gebeurtenissen of intervallen.
- `HKCorrelationType`: gegroepeerde samples, bijvoorbeeld bloeddruk of voeding.
- `HKActivitySummaryType`: activity-ring-samenvattingen.
- `HKAudiogramSampleType`: audiogramdata.
- `HKElectrocardiogramType`: ECG-reeksen.
- `HKSeriesType`: reeksen zoals heartbeat en workout routes.
- `HKClinicalType`: klinische records.
- `HKWorkoutType`: workouts.

## Profielkenmerken

`activityMoveMode`, `biologicalSex`, `bloodType`, `dateOfBirth`,
`fitzpatrickSkinType`, `wheelchairUse`.

## Activiteit en energie

`stepCount`, `distanceWalkingRunning`, `runningSpeed`, `runningStrideLength`,
`runningPower`, `runningGroundContactTime`, `runningVerticalOscillation`,
`distanceCycling`, `pushCount`, `distanceWheelchair`, `swimmingStrokeCount`,
`distanceSwimming`, `distanceDownhillSnowSports`, `basalEnergyBurned`,
`activeEnergyBurned`, `flightsClimbed`, `nikeFuel`, `appleExerciseTime`,
`appleMoveTime`, `appleStandHour`, `appleStandTime`, `vo2Max`,
`lowCardioFitnessEvent`.

## Lichaamsmetingen

`height`, `bodyMass`, `bodyMassIndex`, `leanBodyMass`, `bodyFatPercentage`,
`waistCircumference`.

## Reproductieve gezondheid

`menstrualFlow`, `intermenstrualBleeding`, `infrequentMenstrualCycles`,
`irregularMenstrualCycles`, `persistentIntermenstrualBleeding`,
`prolongedMenstrualPeriods`, `basalBodyTemperature`, `cervicalMucusQuality`,
`ovulationTestResult`, `progesteroneTestResult`, `sexualActivity`,
`contraceptive`, `pregnancy`, `pregnancyTestResult`, `lactation`,
`menopausalState`, `bleedingAfterMenopause`.

## Gehoor

`environmentalAudioExposure`, `headphoneAudioExposure`,
`environmentalAudioExposureEvent`, `headphoneAudioExposureEvent`,
`audioExposureEvent`, plus audiograms.

## Vitale functies en hart

`heartRate`, `lowHeartRateEvent`, `highHeartRateEvent`,
`irregularHeartRhythmEvent`, `restingHeartRate`, `heartRateVariabilitySDNN`,
`heartRateRecoveryOneMinute`, `atrialFibrillationBurden`,
`walkingHeartRateAverage`, heartbeat series, ECG, `oxygenSaturation`,
`bodyTemperature`, `bloodPressure`, `bloodPressureSystolic`,
`bloodPressureDiastolic`, `respiratoryRate`.

Provider- of Apple-classificaties blijven als zodanig gelabeld. Body maakt uit
ritme-events, ECG of zuurstofdata geen eigen diagnose.

## Voeding

### Energie en macro’s

`food`, `dietaryEnergyConsumed`, `dietaryCarbohydrates`, `dietaryFiber`,
`dietarySugar`, `dietaryFatTotal`, `dietaryFatMonounsaturated`,
`dietaryFatPolyunsaturated`, `dietaryFatSaturated`, `dietaryCholesterol`,
`dietaryProtein`.

### Vitaminen

`dietaryVitaminA`, `dietaryThiamin`, `dietaryRiboflavin`, `dietaryNiacin`,
`dietaryPantothenicAcid`, `dietaryVitaminB6`, `dietaryBiotin`,
`dietaryVitaminB12`, `dietaryVitaminC`, `dietaryVitaminD`, `dietaryVitaminE`,
`dietaryVitaminK`, `dietaryFolate`.

### Mineralen en ultratrace

`dietaryCalcium`, `dietaryChloride`, `dietaryIron`, `dietaryMagnesium`,
`dietaryPhosphorus`, `dietaryPotassium`, `dietarySodium`, `dietaryZinc`,
`dietaryChromium`, `dietaryCopper`, `dietaryIodine`, `dietaryManganese`,
`dietaryMolybdenum`, `dietarySelenium`.

### Drank

`dietaryWater`, `dietaryCaffeine`, `bloodAlcoholContent`,
`numberOfAlcoholicBeverages`.

## Mobiliteit

`appleWalkingSteadiness`, `appleWalkingSteadinessEvent`,
`sixMinuteWalkTestDistance`, `walkingSpeed`, `walkingStepLength`,
`walkingAsymmetryPercentage`, `walkingDoubleSupportPercentage`,
`stairAscentSpeed`, `stairDescentSpeed`.

## Lab- en testresultaten

`bloodAlcoholContent`, `bloodGlucose`, `electrodermalActivity`,
`forcedExpiratoryVolume1`, `forcedVitalCapacity`, `inhalerUsage`,
`insulinDelivery`, `numberOfTimesFallen`, `peakExpiratoryFlowRate`,
`peripheralPerfusionIndex`.

## Mindfulness, slaap en herstel

`mindfulSession`, `sleepAnalysis`, `appleSleepingWristTemperature` en Apple’s
classificatie voor slaapgerelateerde ademhalingsverstoringen.

## Zelfzorg en omgeving

- `toothbrushingEvent`
- `handwashingEvent`
- `uvExposure`
- `underwaterDepth`
- `waterTemperature`
- vision prescription samples

## Symptomen

### Buik en spijsvertering

`abdominalCramps`, `bloating`, `constipation`, `diarrhea`, `heartburn`,
`nausea`, `vomiting`.

### Algemeen

`appetiteChanges`, `chills`, `dizziness`, `fainting`, `fatigue`, `fever`,
`generalizedBodyAche`, `hotFlashes`.

### Hart en longen

`chestTightnessOrPain`, `coughing`, `rapidPoundingOrFlutteringHeartbeat`,
`shortnessOfBreath`, `skippedHeartbeat`, `wheezing`.

### Overig

`lowerBackPain`, `headache`, `memoryLapse`, `moodChanges`, `lossOfSmell`,
`lossOfTaste`, `runnyNose`, `soreThroat`, `sinusCongestion`, `breastPain`,
`pelvicPain`, `vaginalDryness`, `acne`, `drySkin`, `hairLoss`, `nightSweats`,
`sleepChanges`, `bladderIncontinence`.

## Workouts

HealthKit ondersteunt workoutrecords, activiteiten, statistieken, events,
workout routes en gekoppelde quantity/category-samples. De exacte beschikbare
velden hangen af van workouttype, bronapparaat en OS-versie.

## Klinische records

`allergyRecord`, `clinicalNoteRecord`, `conditionRecord`,
`immunizationRecord`, `labResultRecord`, `medicationRecord`, `procedureRecord`,
`vitalSignRecord`, `coverageRecord`.

Klinische records vormen een afzonderlijk gevoelig productgebied. Ze worden
niet automatisch gebruikt voor wellnessscores en vereisen een expliciete,
zichtbare functie en toestemming.

## Provenance en deduplicatie

Body bewaart minimaal:

- HealthKit object/sample-ID;
- source revision, source bundle en product type;
- device metadata;
- start/eindtijd en tijdzone waar beschikbaar;
- oorspronkelijke unit;
- metadata en sync identifiers;
- recording context en user-entered-status;
- type identifier en OS-versie;
- gemeten, Apple-afgeleid, andere-app-afgeleid, klinisch of handmatig.

Data die via een vendor-app én een directe vendor-API binnenkomt, wordt niet
blind op timestamp samengevoegd. Deduplicatie houdt beide bronnen traceerbaar.

## Open restwerk

Voor implementatie moet ieder identifier nog worden gekoppeld aan:

1. minimum-OS-versie en platform;
2. lees-/schrijfmogelijkheid;
3. unit en aggregatiestijl;
4. gevoelige autorisatie- of entitlementregels;
5. exacte samplevelden;
6. export-/serveropslagbeperkingen volgens actuele Apple-richtlijnen.
