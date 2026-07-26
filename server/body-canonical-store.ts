import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  and,
  desc,
  eq,
  gt,
  inArray,
  isNull,
} from "drizzle-orm";
import { db } from "./db";
import {
  bodyConnections,
  bodyConsentReceipts,
  bodyMetricResultInputs,
  bodyMetricResults,
  bodyOauthTransactions,
  bodyObservations,
  bodyRawIngestionEvents,
  bodyResourceSyncStates,
} from "../shared/schema";
import {
  bodyConsentReceiptSchema,
  bodyMetricResultSchema,
  bodyRawIngestionEnvelopeSchema,
  canonicalBodyObservationSchema,
  type BodyConsentReceipt,
  type BodyMetricResult,
  type BodyRawIngestionEnvelope,
  type CanonicalBodyObservation,
} from "../shared/body-canonical";

function requireDatabase() {
  if (!db) {
    throw new Error("Body canonical storage requires DATABASE_URL");
  }
  return db;
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function splitValue(value: unknown) {
  if (typeof value === "number") {
    return {
      numericValue: String(value),
      textValue: null,
      structuredValue: null,
    };
  }

  if (typeof value === "string") {
    return {
      numericValue: null,
      textValue: value,
      structuredValue: null,
    };
  }

  if (typeof value === "boolean") {
    return {
      numericValue: null,
      textValue: null,
      structuredValue: { value },
    };
  }

  return {
    numericValue: null,
    textValue: null,
    structuredValue: value,
  };
}

export async function recordBodyConsentReceipt(
  input: BodyConsentReceipt,
) {
  const receipt = bodyConsentReceiptSchema.parse(input);
  const database = requireDatabase();

  const [created] = await database
    .insert(bodyConsentReceipts)
    .values({
      id: receipt.id,
      userId: receipt.userId,
      providerId: receipt.providerId,
      purposeIds: receipt.purposeIds,
      dataCategories: receipt.dataCategories,
      scopes: receipt.scopes,
      noticeVersion: receipt.noticeVersion,
      action: receipt.action,
      locale: receipt.locale,
      collectionSurface: receipt.collectionSurface,
      recordedAt: new Date(receipt.recordedAt),
    })
    .returning();

  return created;
}

type OAuthTransactionInput = {
  userId: string;
  providerId: string;
  requestedScopes: string[];
  redirectUri: string;
  sessionBinding: string;
  ttlSeconds?: number;
};

export async function createBodyOAuthTransaction({
  userId,
  providerId,
  requestedScopes,
  redirectUri,
  sessionBinding,
  ttlSeconds = 10 * 60,
}: OAuthTransactionInput) {
  const database = requireDatabase();
  const state = randomBytes(32).toString("base64url");
  const now = Date.now();

  await database.insert(bodyOauthTransactions).values({
    userId,
    providerId,
    stateHash: sha256(state),
    sessionBindingHash: sha256(sessionBinding),
    requestedScopes,
    redirectUri,
    expiresAt: new Date(now + ttlSeconds * 1000),
  });

  return {
    state,
    expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
  };
}

type ConsumeOAuthTransactionInput = {
  providerId: string;
  state: string;
  sessionBinding: string;
};

export async function consumeBodyOAuthTransaction({
  providerId,
  state,
  sessionBinding,
}: ConsumeOAuthTransactionInput) {
  const database = requireDatabase();
  const stateHash = sha256(state);

  const [candidate] = await database
    .select()
    .from(bodyOauthTransactions)
    .where(
      and(
        eq(bodyOauthTransactions.providerId, providerId),
        eq(bodyOauthTransactions.stateHash, stateHash),
      ),
    )
    .limit(1);

  if (
    !candidate ||
    !safeEqualHex(candidate.sessionBindingHash, sha256(sessionBinding))
  ) {
    return null;
  }

  const [consumed] = await database
    .update(bodyOauthTransactions)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(bodyOauthTransactions.id, candidate.id),
        isNull(bodyOauthTransactions.usedAt),
        gt(bodyOauthTransactions.expiresAt, new Date()),
      ),
    )
    .returning();

  return consumed ?? null;
}

export async function listBodyConnections(userId: string) {
  const database = requireDatabase();
  return database
    .select({
      id: bodyConnections.id,
      providerId: bodyConnections.providerId,
      route: bodyConnections.route,
      status: bodyConnections.status,
      grantedScopes: bodyConnections.grantedScopes,
      connectedAt: bodyConnections.connectedAt,
      disconnectedAt: bodyConnections.disconnectedAt,
      lastSuccessfulSyncAt: bodyConnections.lastSuccessfulSyncAt,
      lastAttemptedSyncAt: bodyConnections.lastAttemptedSyncAt,
      lastErrorCode: bodyConnections.lastErrorCode,
    })
    .from(bodyConnections)
    .where(eq(bodyConnections.userId, userId));
}

export async function listBodyResourceStates(
  userId: string,
  connectionId: string,
) {
  const database = requireDatabase();
  const [ownedConnection] = await database
    .select({ id: bodyConnections.id })
    .from(bodyConnections)
    .where(
      and(
        eq(bodyConnections.id, connectionId),
        eq(bodyConnections.userId, userId),
      ),
    )
    .limit(1);

  if (!ownedConnection) return null;

  return database
    .select()
    .from(bodyResourceSyncStates)
    .where(eq(bodyResourceSyncStates.connectionId, connectionId));
}

export async function recordRawBodyIngestion(
  input: BodyRawIngestionEnvelope,
) {
  const envelope = bodyRawIngestionEnvelopeSchema.parse(input);
  const database = requireDatabase();

  const inserted = await database
    .insert(bodyRawIngestionEvents)
    .values({
      id: envelope.id,
      userId: envelope.userId,
      connectionId: envelope.connectionId,
      providerId: envelope.providerId,
      resourceFamily: envelope.resourceFamily,
      providerRecordId: envelope.providerRecordId,
      providerRecordVersion: envelope.providerRecordVersion,
      operation: envelope.operation,
      idempotencyKey: envelope.idempotencyKey,
      payloadHash: envelope.payloadHash,
      payloadReference: envelope.payloadReference,
      receivedAt: new Date(envelope.receivedAt),
    })
    .onConflictDoNothing({
      target: [
        bodyRawIngestionEvents.connectionId,
        bodyRawIngestionEvents.idempotencyKey,
      ],
    })
    .returning();

  return {
    created: inserted.length === 1,
    event: inserted[0] ?? null,
  };
}

export async function storeCanonicalBodyObservation(
  input: CanonicalBodyObservation,
) {
  const observation = canonicalBodyObservationSchema.parse(input);
  const database = requireDatabase();
  const value = splitValue(observation.value);

  const [created] = await database
    .insert(bodyObservations)
    .values({
      id: observation.id,
      userId: observation.userId,
      canonicalType: observation.canonicalType,
      ...value,
      canonicalUnit: observation.canonicalUnit,
      observedAt: observation.observedAt
        ? new Date(observation.observedAt)
        : null,
      intervalStart: observation.interval
        ? new Date(observation.interval.start)
        : null,
      intervalEnd: observation.interval
        ? new Date(observation.interval.end)
        : null,
      localDate: observation.localDate,
      timezone: observation.interval?.timezone,
      sourceClass: observation.provenance.sourceClass,
      providerId: observation.provenance.providerId,
      ingestionRoute: observation.provenance.ingestionRoute,
      providerRecordId: observation.provenance.providerRecordId,
      providerRecordVersion: observation.provenance.providerRecordVersion,
      originalType: observation.provenance.originalType,
      originalUnit: observation.provenance.originalUnit,
      originalValue: observation.value,
      sourceAppId: observation.provenance.sourceAppId,
      sourceDeviceId: observation.provenance.sourceDeviceId,
      consentReceiptId: observation.provenance.consentReceiptId,
      coverageRatio:
        observation.quality.coverageRatio === undefined
          ? null
          : String(observation.quality.coverageRatio),
      sourceStatus: observation.quality.sourceStatus,
      sourceQuality: observation.quality.sourceQuality,
      uncertainty: observation.quality.uncertainty,
      status: observation.status,
      supersedesObservationId: observation.supersedesObservationId,
      createdAt: new Date(observation.createdAt),
      updatedAt: new Date(observation.createdAt),
    })
    .returning();

  return created;
}

export async function storeBodyMetricResult(input: BodyMetricResult) {
  const result = bodyMetricResultSchema.parse(input);
  const database = requireDatabase();
  const value = splitValue(result.value);

  const [created] = await database
    .insert(bodyMetricResults)
    .values({
      id: result.id,
      userId: result.userId,
      metricId: result.metricId,
      specificationVersion: result.specificationVersion,
      disposition: result.disposition,
      ...value,
      canonicalUnit: result.canonicalUnit,
      periodStart: result.period ? new Date(result.period.start) : null,
      periodEnd: result.period ? new Date(result.period.end) : null,
      localDate: result.localDate,
      state: result.state,
      sourceNamespace: result.sourceNamespace,
      transformationId: result.transformationId,
      coverageRatio:
        result.coverageRatio === undefined
          ? null
          : String(result.coverageRatio),
      freshUntil: result.freshUntil ? new Date(result.freshUntil) : null,
      uncertainty: result.uncertainty,
      generatedAt: new Date(result.generatedAt),
    })
    .returning();

  if (result.inputObservationIds.length > 0) {
    await database
      .insert(bodyMetricResultInputs)
      .values(
        result.inputObservationIds.map((observationId) => ({
          metricResultId: result.id,
          observationId,
          role: "input",
        })),
      )
      .onConflictDoNothing();
  }

  return created;
}

export async function getLatestBodyMetricResult(
  userId: string,
  metricId: string,
) {
  const database = requireDatabase();
  const [result] = await database
    .select()
    .from(bodyMetricResults)
    .where(
      and(
        eq(bodyMetricResults.userId, userId),
        eq(bodyMetricResults.metricId, metricId),
        isNull(bodyMetricResults.supersededAt),
      ),
    )
    .orderBy(desc(bodyMetricResults.generatedAt))
    .limit(1);

  return result ?? null;
}

export async function getBodyMetricResultHistory(
  userId: string,
  metricId: string,
  limit = 365,
) {
  const database = requireDatabase();
  return database
    .select()
    .from(bodyMetricResults)
    .where(
      and(
        eq(bodyMetricResults.userId, userId),
        eq(bodyMetricResults.metricId, metricId),
        isNull(bodyMetricResults.supersededAt),
      ),
    )
    .orderBy(desc(bodyMetricResults.generatedAt))
    .limit(Math.max(1, Math.min(limit, 1000)));
}

export async function getBodyMetricResultReadModel(
  userId: string,
  metricId: string,
) {
  const result = await getLatestBodyMetricResult(userId, metricId);
  if (!result) return null;

  const database = requireDatabase();
  const links = await database
    .select({ observationId: bodyMetricResultInputs.observationId })
    .from(bodyMetricResultInputs)
    .where(eq(bodyMetricResultInputs.metricResultId, result.id));

  const observationIds = links.map(
    (link: { observationId: string }) => link.observationId,
  );
  const observations =
    observationIds.length === 0
      ? []
      : await database
          .select({
            id: bodyObservations.id,
            numericValue: bodyObservations.numericValue,
            canonicalUnit: bodyObservations.canonicalUnit,
            observedAt: bodyObservations.observedAt,
            intervalStart: bodyObservations.intervalStart,
            intervalEnd: bodyObservations.intervalEnd,
            localDate: bodyObservations.localDate,
            timezone: bodyObservations.timezone,
            providerId: bodyObservations.providerId,
            sourceAppId: bodyObservations.sourceAppId,
            sourceDeviceId: bodyObservations.sourceDeviceId,
          })
          .from(bodyObservations)
          .where(
            and(
              eq(bodyObservations.userId, userId),
              inArray(bodyObservations.id, observationIds),
            ),
          );

  return { result, observations };
}
