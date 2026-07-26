import { z } from "zod";

/**
 * Provider-neutral Body contracts.
 *
 * These schemas intentionally keep provider payloads out of widget code. They
 * validate the normalized envelopes used between ingestion, resolution,
 * calculation and presentation.
 */

export const bodyDataStateSchema = z.enum([
  "not_configured",
  "awaiting_data",
  "valid",
  "partial",
  "stale",
  "unsupported",
  "permission_lost",
  "conflict",
  "provider_delayed",
  "error",
]);

export const bodySourceClassSchema = z.enum([
  "direct_provider",
  "platform_health_store",
  "file_import",
  "manual",
  "body_derived",
]);

export const bodyRecordStatusSchema = z.enum([
  "active",
  "superseded",
  "deleted",
  "quarantined",
]);

export const bodyMetricDispositionSchema = z.enum([
  "body_calculated",
  "observation",
  "provider_result",
  "research_only",
  "rejected",
]);

export const bodyConnectionStatusSchema = z.enum([
  "not_configured",
  "authorization_pending",
  "connected_awaiting_data",
  "connected",
  "degraded",
  "permission_lost",
  "disconnected",
  "error",
]);

const isoDateTimeWithOffsetSchema = z.string().datetime({ offset: true });

export const bodyTimeRangeSchema = z
  .object({
    start: isoDateTimeWithOffsetSchema,
    end: isoDateTimeWithOffsetSchema,
    timezone: z.string().min(1).optional(),
    startOffsetMinutes: z.number().int().min(-14 * 60).max(14 * 60).optional(),
    endOffsetMinutes: z.number().int().min(-14 * 60).max(14 * 60).optional(),
  })
  .superRefine((range, context) => {
    if (Date.parse(range.end) < Date.parse(range.start)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Time range end must not precede start",
        path: ["end"],
      });
    }
  });

export const bodyProvenanceSchema = z.object({
  sourceClass: bodySourceClassSchema,
  providerId: z.string().min(1),
  ingestionRoute: z.string().min(1),
  providerRecordId: z.string().min(1).optional(),
  providerRecordVersion: z.string().min(1).optional(),
  originalType: z.string().min(1),
  originalUnit: z.string().min(1).optional(),
  sourceAppId: z.string().min(1).optional(),
  sourceDeviceId: z.string().min(1).optional(),
  ingestedAt: isoDateTimeWithOffsetSchema,
  consentReceiptId: z.string().min(1).optional(),
});

export const bodyQualitySchema = z.object({
  coverageRatio: z.number().min(0).max(1).optional(),
  sourceStatus: z.string().min(1).optional(),
  sourceQuality: z.string().min(1).optional(),
  uncertainty: z.array(z.string().min(1)).default([]),
  validWearSeconds: z.number().nonnegative().optional(),
});

const bodyObservationValueSchema = z.union([
  z.number().finite(),
  z.string(),
  z.boolean(),
  z.record(z.unknown()),
  z.array(z.unknown()),
]);

export const canonicalBodyObservationSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    canonicalType: z
      .string()
      .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/),
    value: bodyObservationValueSchema,
    canonicalUnit: z.string().min(1).optional(),
    observedAt: isoDateTimeWithOffsetSchema.optional(),
    interval: bodyTimeRangeSchema.optional(),
    localDate: z.string().date().optional(),
    provenance: bodyProvenanceSchema,
    quality: bodyQualitySchema.default({
      uncertainty: [],
    }),
    status: bodyRecordStatusSchema.default("active"),
    supersedesObservationId: z.string().min(1).optional(),
    createdAt: isoDateTimeWithOffsetSchema,
  })
  .superRefine((observation, context) => {
    const timeRepresentations = [
      observation.observedAt,
      observation.interval,
      observation.localDate,
    ].filter(Boolean).length;

    if (timeRepresentations === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Observation requires an instant, interval, or provider-defined local date",
        path: ["observedAt"],
      });
    }

    if (
      observation.provenance.sourceClass === "body_derived" &&
      !observation.provenance.providerRecordId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Body-derived observations require a deterministic result record ID",
        path: ["provenance", "providerRecordId"],
      });
    }
  });

export const bodyMetricResultSchema = z
  .object({
    id: z.string().min(1),
    userId: z.string().min(1),
    metricId: z
      .string()
      .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/),
    specificationVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    disposition: bodyMetricDispositionSchema,
    value: bodyObservationValueSchema.optional(),
    canonicalUnit: z.string().min(1).optional(),
    period: bodyTimeRangeSchema.optional(),
    localDate: z.string().date().optional(),
    state: bodyDataStateSchema,
    sourceNamespace: z.string().min(1).optional(),
    inputObservationIds: z.array(z.string().min(1)).default([]),
    transformationId: z.string().min(1).optional(),
    coverageRatio: z.number().min(0).max(1).optional(),
    freshUntil: isoDateTimeWithOffsetSchema.optional(),
    uncertainty: z.array(z.string().min(1)).default([]),
    generatedAt: isoDateTimeWithOffsetSchema,
  })
  .superRefine((result, context) => {
    if (
      ["valid", "partial", "stale"].includes(result.state) &&
      result.value === undefined
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${result.state} metric results require a value`,
        path: ["value"],
      });
    }

    if (
      result.disposition === "provider_result" &&
      !result.sourceNamespace
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provider results require a source namespace",
        path: ["sourceNamespace"],
      });
    }

    if (
      result.disposition === "body_calculated" &&
      !result.transformationId
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Body-calculated results require a transformation ID",
        path: ["transformationId"],
      });
    }

    if (
      result.disposition === "research_only" ||
      result.disposition === "rejected"
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${result.disposition} metrics cannot create production results`,
        path: ["disposition"],
      });
    }
  });

export const bodyConsentReceiptSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  purposeIds: z.array(z.string().min(1)).min(1),
  dataCategories: z.array(z.string().min(1)).min(1),
  providerId: z.string().min(1).optional(),
  scopes: z.array(z.string().min(1)).default([]),
  noticeVersion: z.string().min(1),
  action: z.enum(["granted", "refused", "withdrawn"]),
  locale: z.string().min(2),
  recordedAt: isoDateTimeWithOffsetSchema,
  collectionSurface: z.string().min(1),
});

export const bodyConnectionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  providerId: z.string().min(1),
  route: z.enum([
    "server_oauth",
    "native_ios",
    "native_android",
    "signed_push_bridge",
    "file_import",
  ]),
  status: bodyConnectionStatusSchema,
  credentialReference: z.string().min(1).optional(),
  grantedScopes: z.array(z.string().min(1)).default([]),
  consentReceiptId: z.string().min(1),
  connectedAt: isoDateTimeWithOffsetSchema.optional(),
  disconnectedAt: isoDateTimeWithOffsetSchema.optional(),
  lastSuccessfulSyncAt: isoDateTimeWithOffsetSchema.optional(),
  lastAttemptedSyncAt: isoDateTimeWithOffsetSchema.optional(),
  lastErrorCode: z.string().min(1).optional(),
});

export const bodyResourceSyncStateSchema = z.object({
  connectionId: z.string().min(1),
  resourceFamily: z.string().min(1),
  state: bodyDataStateSchema,
  cursorReference: z.string().min(1).optional(),
  requestedFrom: isoDateTimeWithOffsetSchema.optional(),
  receivedThrough: isoDateTimeWithOffsetSchema.optional(),
  lastSuccessfulSyncAt: isoDateTimeWithOffsetSchema.optional(),
  recordCount: z.number().int().nonnegative().default(0),
  errorCode: z.string().min(1).optional(),
});

export const bodyRawIngestionEnvelopeSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  connectionId: z.string().min(1),
  providerId: z.string().min(1),
  resourceFamily: z.string().min(1),
  providerRecordId: z.string().min(1).optional(),
  providerRecordVersion: z.string().min(1).optional(),
  operation: z.enum(["upsert", "delete"]),
  idempotencyKey: z.string().min(16),
  payloadHash: z.string().min(32),
  payloadReference: z.string().min(1).optional(),
  receivedAt: isoDateTimeWithOffsetSchema,
});

export type BodyDataState = z.infer<typeof bodyDataStateSchema>;
export type BodyConnection = z.infer<typeof bodyConnectionSchema>;
export type BodyConsentReceipt = z.infer<typeof bodyConsentReceiptSchema>;
export type BodyResourceSyncState = z.infer<
  typeof bodyResourceSyncStateSchema
>;
export type BodyRawIngestionEnvelope = z.infer<
  typeof bodyRawIngestionEnvelopeSchema
>;
export type CanonicalBodyObservation = z.infer<
  typeof canonicalBodyObservationSchema
>;
export type BodyMetricResult = z.infer<typeof bodyMetricResultSchema>;
