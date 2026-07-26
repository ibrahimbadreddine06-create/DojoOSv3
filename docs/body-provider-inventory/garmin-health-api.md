# Garmin Health API — publieke datainventaris

Status: **publieke categorieën compleet; veldschema geblokkeerd achter
program approval**

Primaire bron:

- https://developer.garmin.com/gc-developer-program/health-api/

## Toegang

- Gebruikers geven toestemming en synchroniseren hun Garmin-apparaat met Garmin
  Connect.
- Garmin levert JSON via push of ping/pull.
- Evaluation access volgt pas na programma-goedkeuring.
- Commercieel productiegebruik vereist een licentievergoeding.
- Feedselectie is configureerbaar.

## Publiek bevestigde datadomeinen

- stappen;
- intensity minutes;
- slaap;
- calorieën;
- hartslag;
- stress;
- Pulse Ox;
- Body Battery;
- lichaamssamenstelling;
- respiratie;
- bloeddruk;
- enhanced beat-to-beat intervals;
- detailed stress;
- detailed Pulse Ox;
- epoch summaries voor all-day activity.

## Publiek bevestigde recordcontext

- Garmin-user/consentrelatie;
- apparaat en synchronisatie via Garmin Connect;
- all-day summaries;
- gedetailleerde feeds;
- seconde-niveau hartslag tijdens activities waar ondersteund;
- backfillmogelijkheden in de evaluation tooling.

## Wat Body niet mag verzinnen

De publieke marketingpagina bewijst geen exacte veldnaam, unit, nullability,
samplefrequentie, devicegate of historical window. Daarom worden voorlopig geen
onbevestigde schema’s als implementatiecontract geschreven.

Garmin-specifieke waarden zoals Body Battery en stress blijven
`provider_derived`. Body reconstrueert of hernoemt ze niet alsof het open
standaardformules zijn.

## Vereiste vendor gate

Na Garmin-programmatoegang moet de officiële schemaset worden geëxporteerd en
voor elke feed vastgelegd:

1. endpoint/feednaam;
2. ieder veld en nested veld;
3. eenheid, bereik en samplefrequentie;
4. apparaat-, firmware- en featurevoorwaarden;
5. backfill, update en deletegedrag;
6. permission/consent;
7. push- en ping/pull-payload;
8. measured versus Garmin-derived;
9. quality- en missing-data-indicatoren;
10. licentie- en displayvoorwaarden.

Tot dan is Garmin een belangrijke geplande connector, maar niet
implementatie-ready.

