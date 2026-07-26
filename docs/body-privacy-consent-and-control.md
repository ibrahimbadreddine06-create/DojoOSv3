# Body privacy, consent and user-control contract

Status: product/engineering baseline; requires qualified legal review before
launch in each jurisdiction.

## Scope and legal posture

Body processes highly sensitive personal and health-related data. The initial
EU posture is privacy by design/default, granular purpose control and explicit
user action before health-data ingestion.

This document is an engineering contract, not legal advice. The final controller
role, Article 6 legal basis, Article 9 condition, processor/subprocessor terms,
international-transfer mechanism, retention schedule, age policy and
jurisdictional claims require counsel and a living DPIA before production.

## Product principles

1. No Body health ingestion before clear user authorization.
2. Consent/control is granular by connection, data category and materially
   different purpose.
3. Refusing optional processing does not make unrelated core functionality
   unusable.
4. Withdrawal is as easy as granting permission.
5. Connection authorization, Body processing permission and widget placement
   are separate decisions.
6. Data minimization applies at collection, storage, calculation and display.
7. Sensitive features are opt-in and never silently exposed from inferred
   demographics.
8. Historical data is not silently retained or deleted when a provider is
   disconnected; the user receives a clear choice subject to legal duties.
9. Marketing, advertising, model training and unrelated product analytics are
   not bundled into the health-data purpose.
10. No sale of personal health data.

## Consent layers

### Account and core service

The privacy notice identifies controller/contact details, purposes, categories,
legal bases, retention, recipients, transfers, rights, complaint route and any
automated decision-making information.

### Provider connection

Before OAuth/platform permission:

- provider/route is named;
- requested data categories are shown;
- intended Body features are explained;
- conditional device/region/account limitations are disclosed;
- current storage/retention behavior is linked.

The provider's permission dialog does not replace Body's own transparency.

### Sensitive feature activation

Separate explicit activation is required for features such as cycle, sexual or
intimate observations, clinical records, medication, images and other
high-sensitivity categories. A profile attribute alone does not activate them.

### Secondary purpose

Research, product improvement using identifiable/health data, personalization
beyond the requested feature and future AI training each require a separately
reviewed purpose and legal basis. They are not assumed from core-service
consent.

## Consent receipt

Every consent/authorization event stores:

- user/account ID;
- purpose and data-category identifiers;
- notice/consent text version;
- timestamp and locale;
- provider/scopes where applicable;
- grant, refusal or withdrawal event;
- collection surface/client version;
- guardian/age-assurance context if a future minor flow is legally supported.

The receipt proves what was presented and chosen without storing unnecessary
interaction telemetry.

## Age posture

The initial launch targets people legally able to create and authorize their
own account in the launch jurisdiction. A minor flow is not enabled merely by
removing a UI age limit.

Before supporting children/minors, Body must implement and legally validate:

- country-specific age-of-consent/account rules;
- guardian authorization where required;
- reasonable age/guardian verification;
- child-appropriate clear language;
- stricter defaults and data minimization;
- guardian versus child access/control boundaries;
- sensitive-feature restrictions and safeguarding;
- deletion/transition behavior when the child reaches the applicable age.

EU Member State thresholds for consent-based information-society services can
vary, so one global numeric assumption is not acceptable.

## User control surface

### Connections

Per provider:

- connection state and last successful sync;
- granted categories/scopes;
- resource-level failures;
- reconnect/reauthorize;
- disconnect;
- retain or delete imported data where applicable.

### Data

Users can:

- inspect data categories and sources;
- export machine-readable data;
- correct/supersede manual entries;
- request deletion;
- select preferred sources where legitimate;
- resolve eligible conflicts;
- see which derived metrics depend on a source.

### Widgets

Removing a widget removes a view, not its underlying data. Deleting data
explains which widgets/history/derived values will be affected.

### Consent

Users can inspect and withdraw optional consent by purpose. Withdrawal stops
future processing under that consent and triggers the documented downstream
behavior; it does not retroactively make prior lawful processing nonexistent.

## Retention and deletion model

Retention is category- and purpose-specific. “Keep forever” is not a default.

Required implementation properties:

- raw, canonical and derived records share a dependency graph;
- deletions/tombstones propagate to derived results and caches;
- backups have bounded expiry and restoration does not resurrect deleted data
  into active use;
- audit/security records are minimized and separately retained under an
  appropriate legal basis;
- provider deletion events are distinguished from user account deletion;
- account deletion has a trackable completion workflow;
- legal holds, if ever applicable, are explicit and narrowly scoped.

## Security baseline

- Encryption in transit and at rest.
- Managed secret storage; provider tokens never enter client bundles/logs.
- Token scopes minimized and refresh/revocation handled securely.
- Tenant/user authorization enforced server-side on every data path.
- Sensitive fields excluded from routine logs, analytics and error payloads.
- Key rotation and environment separation.
- Dependency, infrastructure and access monitoring.
- Least-privilege staff access with auditable break-glass behavior.
- Rate limiting, replay protection and webhook verification.
- Documented incident detection, containment and breach-assessment process.
- Regular security review and testing before production and after material
  architecture changes.

## Profiling and automated insights

Body may compute transparent requested metrics under their specification.
It does not silently turn those results into high-impact eligibility,
employment, insurance, credit or similar decisions.

Future AI/advice behavior requires a separate review covering:

- purpose and lawful basis;
- input visibility and user control;
- model/provider data handling;
- explainability and uncertainty;
- medical/safety boundary;
- human escalation;
- automated-decision/profiling obligations;
- training retention and opt-in.

## DPIA gate

Because Body is designed for extensive sensitive health-data processing and
automated personal insights, the project treats a DPIA as a pre-launch
requirement, not an optional afterthought.

The DPIA is living and is revisited when:

- a new provider or sensitive category is added;
- a new derived score/insight is introduced;
- AI/personalized advice changes;
- data is used for a new purpose;
- minors are supported;
- international transfers/subprocessors change;
- retention or security architecture materially changes;
- scale or risk profile changes.

Unmitigated high residual risk triggers consultation with the appropriate
authority before processing.

## EHDS and regulated-feature watch

The European Health Data Space Regulation is now adopted, but its obligations
and application timelines must be mapped to Body's actual product role. Body
must not call itself an EHR system, wellness device or medical device merely to
select a convenient regulatory category. Clinical imports, interoperability
claims and future regulated features receive role-specific legal analysis.

## Engineering acceptance tests

1. Connect with only a subset of scopes.
2. Refuse an optional category and keep unrelated features working.
3. Withdraw one purpose without disconnecting unrelated processing.
4. Revoke permission at the provider and reconcile Body state.
5. Disconnect and retain allowed history.
6. Disconnect and delete imported data and dependent derivations.
7. Export raw/canonical/derived provenance in machine-readable form.
8. Delete account through active stores, queues, search, analytics and bounded
   backup lifecycle.
9. Verify no token/health payload reaches client logs or analytics.
10. Restore a backup without resurrecting completed deletion into active data.
11. Change consent-text version without rewriting old receipts.
12. Verify sensitive widgets are not auto-enabled by profile inference.

## Official sources

- GDPR, Regulation (EU) 2016/679:
  https://eur-lex.europa.eu/eli/reg/2016/679/oj
- European Commission — information and individual rights:
  https://commission.europa.eu/law/law-topic/data-protection/information-individuals_en
- European Commission — required transparency information:
  https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/principles-gdpr/what-information-must-be-given-individuals-whose-data-collected_en
- EDPB consent summary (2026):
  https://www.edpb.europa.eu/system/files/2026-04/edpb-summary-consent_en.pdf
- European Commission — DPIA requirement:
  https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/obligations/when-data-protection-impact-assessment-dpia-required_en
- EDPB — DPIA guidance:
  https://www.edpb.europa.eu/topics/accountability-and-compliance-tools/data-protection-impact-assessment_en
- European Commission — safeguards for children's data:
  https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en
- European Health Data Space, Regulation (EU) 2025/327:
  https://eur-lex.europa.eu/eli/reg/2025/327/oj

