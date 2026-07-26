# Body Canonical Health Data Model

Status: **harmonisatiebasis v0.1 — provider mapping wordt incrementeel ingevuld**

Dit model is geen lijst van widgets. Het is de bewijs- en datalaag waaruit
widgets, historie, detailpagina’s, berekeningen en toekomstige AI-functies
betrouwbaar kunnen lezen.

## Kernregel

Body bewaart drie dingen afzonderlijk:

1. wat de bron exact leverde;
2. hoe Body dat canoniek interpreteert;
3. wat Body daarna berekent.

Geen van die lagen mag de andere overschrijven.

## Recordfamilies

### Measurement

Een waarde op één tijdstip, bijvoorbeeld gewicht, rusthartslag, bloeddruk of
SpO2.

### Sample series

Een geordende reeks samples met tijd of offset, bijvoorbeeld hartslag, HRV,
vermogen, temperatuur, ECG of routepunten.

### Interval

Een waarde over een start/eindperiode, bijvoorbeeld stappen, calorieën,
activiteitsintensiteit of hydratatie.

### Session

Een semantische activiteit met grenzen en onderdelen, bijvoorbeeld workout,
slaap, mindfulness, maaltijd of rustmoment.

### Event

Een gebeurtenis, classificatie of gebruikersactie, bijvoorbeeld
inactiviteitsalarm, tandenpoetsen, menstruatieflow of een tag.

### Daily summary

Een bronafgeleide dagsamenvatting. De civil day, timezone en provideralgoritme
zijn onderdeel van de identiteit.

### Goal

Een doel met geldigheidsperiode, bron en target. Een goal is geen measurement.

### Profile fact

Een relatief stabiel kenmerk met geldigheidsperiode, bijvoorbeeld geboortedatum,
biologisch geslacht, lengte of wheelchair use.

### Clinical record

Een afzonderlijk gevoelig record met klinische provenance. Dit wordt nooit
stilzwijgend gemengd met algemene wellnessdata.

### Provider insight

Een proprietary providerwaarde zoals Oura Readiness, WHOOP Recovery, Garmin
Body Battery of Samsung Energy Score. De originele naam, versie en schaal
blijven behouden.

### Body derivation

Een door Body berekende waarde met een versieerbare formule, inputmanifest,
kwaliteitsstatus en uitlegbare output.

### Extensible record

Nieuwe of zeldzame data die nog geen canonieke semantiek heeft, blijft volledig
bruikbaar als typed extension met bronschema. Hierdoor blijft het model open:
**ALLES KAN**, zonder onbekende data foutief in een bestaande categorie te
forceren.

## Canonical envelope

Ieder record heeft minimaal:

| Veld | Betekenis |
|---|---|
| `record_id` | Interne onveranderlijke ID |
| `record_family` | Een van de recordfamilies hierboven |
| `canonical_type` | Versiebeheerde semantische type-ID |
| `schema_version` | Versie van het canonieke schema |
| `subject_id` | Gebruiker/persoon waarop de data slaat |
| `source_id` | Concrete bronconnectie |
| `provider` | Apple, Google, Oura, WHOOP, Polar, enzovoort |
| `provider_object` | Exact bronobject/endpoint/type |
| `provider_record_id` | ID uit de bron, indien aanwezig |
| `provider_field` | Exact bronveld of meettype |
| `provenance_class` | measured, manual, active, passive, provider-derived, Body-derived, clinical of metadata |
| `observed_at` | Fysieke meettijd bij instant records |
| `start_at` / `end_at` | Interval- of sessiongrenzen |
| `timezone_offset` | Offset die bij de bronwaarde hoort |
| `civil_date` | Lokale kalenderdag indien semantisch relevant |
| `received_at` | Wanneer Body de data ontving |
| `modified_at_source` | Laatste bronwijziging |
| `value` | Canonieke waarde |
| `unit` | Canonieke unit |
| `source_value` | Originele waarde |
| `source_unit` | Originele unit |
| `quality` | Meet-/providerkwaliteit |
| `availability` | complete, partial, missing, withheld, unsupported, deleted |
| `missing_reason` | Reden waarom data ontbreekt |
| `device_id` | Canonieke deviceverwijzing |
| `raw_payload_ref` | Versleutelde referentie naar bronpayload |
| `supersedes` | Record dat door deze versie wordt vervangen |
| `deleted_at` | Bron- of gebruikersdelete |

Niet iedere familie gebruikt ieder tijdveld, maar een record mag nooit een
verzonnen tijd of timezone krijgen om een schema te vullen.

## Value types

- scalar number;
- integer/count;
- boolean;
- enum/category;
- text/note;
- duration;
- timestamp/local time;
- quantity met unit;
- range;
- vector;
- geolocation;
- sample array;
- stage/segment array;
- structured object;
- attachment/reference.

Een nieuwe value type kan worden toegevoegd zonder bestaande records te
herinterpreteren.

## Provenanceketen

Iedere afleiding bevat:

- `derivation_id`;
- formule-/algoritmeversie;
- uitvoertijd;
- exacte input-record-ID’s;
- parameterwaarden;
- baselinevenster;
- uitsluitingen;
- missing-data-behandeling;
- output confidence/quality;
- verklaring die uit dezelfde versie komt als de berekening.

Een UI-tekst mag nooit een sterkere claim doen dan deze provenance toestaat.

## Device model

| Veld | Betekenis |
|---|---|
| `device_id` | Interne ID |
| `provider_device_id` | Bron-ID |
| `manufacturer` | Fabrikant |
| `model` | Model |
| `hardware_version` | Hardware |
| `firmware_version` | Firmware |
| `device_type` | Open, uitbreidbare type-ID |
| `body_location` | Meetlocatie indien relevant |
| `first_seen_at` / `last_seen_at` | Zichtbaarheidsperiode |
| `capabilities_snapshot` | Versiebeheerde capabilityset |

Capabilities worden niet alleen uit modelnaam afgeleid; provider-, regio-,
firmware- en gebruikersinstellingen kunnen ze veranderen.

## Source connection model

Een connectie bewaart:

- route: native health store, direct cloud API, aggregator, import of manual;
- scopes en consentversie;
- status en laatste succesvolle sync;
- cursor/change token;
- backfillwindow;
- regio en plan;
- refresh-/revocationstatus;
- provider user ID;
- datacategorieën die daadwerkelijk zijn geobserveerd;
- dataretentie- en deletionstate.

Secrets en tokens staan niet in het health record en worden afzonderlijk
versleuteld opgeslagen.

## Canonical type namespaces

De namespace is uitbreidbaar en niet gelijk aan de navigatiepagina:

- `activity.*`
- `energy.*`
- `cardio.*`
- `respiration.*`
- `sleep.*`
- `recovery.*`
- `body.*`
- `temperature.*`
- `oxygen.*`
- `nutrition.*`
- `hydration.*`
- `cycle.*`
- `mindfulness.*`
- `selfcare.*`
- `environment.*`
- `symptom.*`
- `clinical.*`
- `provider_insight.*`
- `extension.*`

Eén canonical type kan op meerdere Body-pagina’s worden gebruikt. De pagina
bepaalt context en presentatie, niet de waarheid van het record.

## Deduplicatie

Deduplicatie is een besluit met bewijs, geen destructieve cleanup.

### Exact match

Zelfde providerrecord-ID of gedeelde client/sync-ID.

### Strong match

Overeenkomst in subject, brondevice, type, tijd, duur, unit/value en
payloadfingerprint.

### Probable session match

Overeenkomst in start/einde, activitytype, afstand, route, device en streams.

### Niet automatisch mergen

- provider-afgeleide scores;
- dagaggregaten met verschillende civil-day-regels;
- HRV met verschillende methodes of vensters;
- slaapstadia van verschillende algoritmen;
- calorieën met onduidelijke active/total-definitie;
- handmatige en gemeten waarden;
- clinical en wellness records.

Een canonical record kan meerdere source assertions hebben. Geen source
verdwijnt door de merge.

## Missing-data-semantiek

Minimaal onderscheiden:

- niet gemeten;
- apparaat niet gedragen;
- batterij leeg;
- permission ontbreekt;
- provider ondersteunt type niet;
- apparaat ondersteunt type niet;
- provider synchronisatie loopt achter;
- kwaliteit onvoldoende;
- gebruiker verwijderde data;
- provider hield data achter;
- onbekende oorzaak;
- echte gemeten nul.

Dit onderscheid is verplicht voor berekeningen en UI.

## Tijd

- Bewaar UTC en bronoffset.
- Bewaar civil date voor dagproducten.
- Maak geen 24-uursaanname: DST-dagen kunnen 23 of 25 uur hebben.
- Reizen kan binnen één sessie offsets veranderen.
- Provider-dagscores worden niet opnieuw aan een andere daggrens toegewezen
  zonder expliciete transformatie.

## Units

- Originele unit blijft bewaard.
- Canonieke conversie is deterministisch en versieerbaar.
- Ronding gebeurt voor presentatie, niet tijdens ingest.
- Percentage, fractie, score en classificatie zijn verschillende semantieken.
- bpm, RR-interval, SDNN en RMSSD worden niet onder één generieke “HRV”-waarde
  samengevoegd.

## Privacyklassen

- general wellness;
- sensitive wellness;
- reproductive/sexual;
- location;
- biometric signal;
- clinical;
- free text/attachment.

Toestemming, retentie, export, delen en logging volgen de hoogste privacyklasse
van record én afleiding.

## Handmatige fallback

Manual input gebruikt dezelfde canonical types waar semantisch correct, maar
altijd `provenance_class=manual`. De UI mag gemeten en handmatige waarden samen
tonen, maar maakt het verschil controleerbaar en gebruikt geen kunstmatige
precisie.

## Volgende harmonisatiestap

Voor elk providerbestand wordt een veldmatrix toegevoegd:

`provider object.field → canonical type → unit conversion → provenance →
availability gates → confidence → evidence`.

Een mapping wordt pas `verified` wanneer de officiële bron zowel veld als
betekenis ondersteunt.
