import type { Express, Request, Response } from "express";
import {
  getBodyMetricResultHistory,
  getBodyMetricResultReadModel,
  listBodyConnections,
  listBodyResourceStates,
} from "./body-canonical-store";
import { bodyOperationalStore } from "./body-operational-store";
import umbrellaRegistry from "../docs/body-widget-umbrella-registry.json";

const umbrellaMetricIds: Record<string, string> = {
  "activity.steps": "activity.steps",
  "activity.active_minutes": "activity.active_minutes",
  "activity.sedentary_time": "activity.sedentary_time",
  "activity.distance": "activity.distance",
  "activity.active_energy": "activity.active_energy",
  "activity.floors_climbed": "activity.floors",
  "activity.training_load": "load.acute_chronic_trends",
  "activity.heart_rate_zones": "exercise.heart_rate_zone_duration",
  "activity.cardio_fitness": "fitness.vo2_max",
  "hub.heart_rate": "cardio.heart_rate",
  "hub.weight": "body.weight",
  "hub.body_composition": "body.composition",
  "hub.blood_pressure": "cardio.blood_pressure",
  "hub.blood_glucose": "metabolic.blood_glucose",
  "rest.sleep_duration": "sleep.total_sleep",
  "rest.sleep_stages": "sleep.stage_duration",
  "rest.sleep_efficiency": "sleep.efficiency",
  "rest.sleep_debt": "sleep.debt_or_need",
  "rest.recovery": "provider.recovery.score",
  "rest.hrv": "cardio.hrv.rmssd",
  "rest.resting_heart_rate": "cardio.heart_rate.resting",
  "rest.respiratory_rate": "respiration.rate",
  "rest.skin_temperature": "temperature.skin",
  "rest.blood_oxygen": "oxygen.saturation",
  "rest.physiological_stress": "provider.stress.score",
};

const manualUmbrellas = new Set([
  "nutrition.caffeine",
  "nutrition.alcohol",
  "rest.perceived_stress",
  "rest.naps",
  "hygiene.cycle",
  "hygiene.skin_progress",
  "hygiene.appearance_progress",
  "hygiene.products",
  "hygiene.symptoms",
]);

function operationalTypesFor(umbrellaId: string) {
  if (umbrellaId.startsWith("activity.")) return ["activity", "workout"];
  if (umbrellaId.startsWith("nutrition.")) return ["intake"];
  if (umbrellaId.startsWith("rest.")) return ["rest"];
  if (umbrellaId.startsWith("hygiene.")) return ["hygiene"];
  return [];
}

function serializeMetricResult(result: Awaited<ReturnType<typeof getBodyMetricResultHistory>>[number]) {
  return {
    id: result.id,
    at: result.periodEnd ?? result.periodStart ?? result.generatedAt,
    periodStart: result.periodStart,
    periodEnd: result.periodEnd,
    localDate: result.localDate,
    value: result.numericValue !== null
      ? Number(result.numericValue)
      : result.textValue ?? result.structuredValue ?? null,
    unit: result.canonicalUnit,
    state: result.state,
    source: result.sourceNamespace,
    coverageRatio: result.coverageRatio === null ? null : Number(result.coverageRatio),
    uncertainty: result.uncertainty,
    specificationVersion: result.specificationVersion,
    transformationId: result.transformationId,
  };
}

type ConnectorAvailability =
  | "native_required"
  | "credentials_required"
  | "partner_approval_required"
  | "implementation_pending"
  | "legacy_disabled";

type HealthConnectorDefinition = {
  id: string;
  label: string;
  route:
    | "native_ios"
    | "native_android"
    | "server_oauth"
    | "partner_api"
    | "legacy";
  availability: ConnectorAvailability;
  configured: boolean;
  notes: string;
};

const connectorDefinitions: HealthConnectorDefinition[] = [
  {
    id: "apple_healthkit",
    label: "Apple Health",
    route: "native_ios",
    availability: "native_required",
    configured: false,
    notes:
      "Requires a native iOS HealthKit host. The former unauthenticated Shortcut summary bridge is disabled.",
  },
  {
    id: "android_health_connect",
    label: "Health Connect",
    route: "native_android",
    availability: "native_required",
    configured: false,
    notes: "Requires a native Android Health Connect host and record-level provenance.",
  },
  {
    id: "fitbit",
    label: "Fitbit",
    route: "server_oauth",
    availability:
      process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.FITBIT_CLIENT_ID && process.env.FITBIT_CLIENT_SECRET,
    ),
    notes:
      "Credentials alone do not mark Fitbit connected; OAuth, scopes and sync must use the canonical connection layer.",
  },
  {
    id: "oura",
    label: "Oura",
    route: "server_oauth",
    availability:
      process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.OURA_CLIENT_ID && process.env.OURA_CLIENT_SECRET,
    ),
    notes: "OAuth and V2 sync implementation pending.",
  },
  {
    id: "whoop",
    label: "WHOOP",
    route: "server_oauth",
    availability:
      process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET,
    ),
    notes: "OAuth and V2 sync implementation pending.",
  },
  {
    id: "polar",
    label: "Polar",
    route: "server_oauth",
    availability:
      process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.POLAR_CLIENT_ID && process.env.POLAR_CLIENT_SECRET,
    ),
    notes: "AccessLink authorization and transaction sync implementation pending.",
  },
  {
    id: "withings",
    label: "Withings",
    route: "server_oauth",
    availability:
      process.env.WITHINGS_CLIENT_ID && process.env.WITHINGS_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.WITHINGS_CLIENT_ID && process.env.WITHINGS_CLIENT_SECRET,
    ),
    notes: "OAuth, notification subscriptions and measure-group sync pending.",
  },
  {
    id: "strava",
    label: "Strava",
    route: "server_oauth",
    availability:
      process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET
        ? "implementation_pending"
        : "credentials_required",
    configured: Boolean(
      process.env.STRAVA_CLIENT_ID && process.env.STRAVA_CLIENT_SECRET,
    ),
    notes: "OAuth and activity sync implementation pending.",
  },
  {
    id: "garmin",
    label: "Garmin",
    route: "partner_api",
    availability: "partner_approval_required",
    configured: false,
    notes: "Requires an approved Garmin Health API partner integration.",
  },
  {
    id: "samsung_health",
    label: "Samsung Health",
    route: "native_android",
    availability: "partner_approval_required",
    configured: false,
    notes:
      "Requires an eligible native Samsung Health Data SDK integration and applicable partner access.",
  },
  {
    id: "google_fit_legacy",
    label: "Google Fit (legacy)",
    route: "legacy",
    availability: "legacy_disabled",
    configured: false,
    notes:
      "Disabled as a production path. Android work targets Health Connect instead.",
  },
];

function requireAuthenticatedUserId(req: Request) {
  if (!req.isAuthenticated() || !(req.user as { id?: string } | undefined)?.id) {
    return null;
  }
  return (req.user as { id: string }).id;
}

export function setupHealthRoutes(app: Express) {
  app.get("/api/health-sync/status", async (req, res) => {
    const userId = requireAuthenticatedUserId(req);
    if (!userId) return res.sendStatus(401);

    let connections: Array<{
      id: string;
      providerId: string;
      route: string;
      status: string;
      grantedScopes: string[];
      connectedAt: Date | null;
      disconnectedAt: Date | null;
      lastSuccessfulSyncAt: Date | null;
      lastAttemptedSyncAt: Date | null;
      lastErrorCode: string | null;
    }> = [];
    let storageReady = true;

    try {
      connections = (await listBodyConnections(userId)) as typeof connections;
    } catch (error) {
      storageReady = false;
      console.error("Body connection status unavailable:", error);
    }

    const byProvider = new Map(
      connections.map((connection) => [connection.providerId, connection]),
    );

    res.json({
      connectors: connectorDefinitions.map((definition) => ({
        ...definition,
        connection: byProvider.get(definition.id) ?? null,
      })),
      storageReady,
      updatedAt: new Date().toISOString(),
    });
  });

  app.get(
    "/api/health-sync/connections/:connectionId/resources",
    async (req, res) => {
      const userId = requireAuthenticatedUserId(req);
      if (!userId) return res.sendStatus(401);

      try {
        const states = await listBodyResourceStates(
          userId,
          req.params.connectionId,
        );
        if (states === null) {
          return res.status(404).json({ message: "Connection not found" });
        }
        res.json({ resources: states });
      } catch (error) {
        console.error("Body resource status unavailable:", error);
        res.status(503).json({
          message: "Canonical Body storage is not available",
        });
      }
    },
  );

  app.get("/api/body/umbrellas/:umbrellaId/detail", async (req, res) => {
    const userId = requireAuthenticatedUserId(req);
    if (!userId) return res.sendStatus(401);

    const umbrella = umbrellaRegistry.umbrellas.find(
      (candidate) => candidate.id === req.params.umbrellaId,
    );
    if (!umbrella) {
      return res.status(404).json({ message: "Widget umbrella not found" });
    }

    const metricId = umbrellaMetricIds[umbrella.id] ?? umbrella.id;
    let metricHistory: Awaited<ReturnType<typeof getBodyMetricResultHistory>> = [];
    let storageAvailable = true;
    try {
      metricHistory = await getBodyMetricResultHistory(userId, metricId);
    } catch (error) {
      storageAvailable = false;
      console.error("Body umbrella metric history unavailable:", error);
    }

    const subjectTypes = operationalTypesFor(umbrella.id);
    let subjects: Awaited<ReturnType<typeof bodyOperationalStore.listSubjects>> = [];
    let histories: Array<NonNullable<Awaited<ReturnType<typeof bodyOperationalStore.getSubjectHistory>>>> = [];
    try {
      subjects = (
        await Promise.all(
          subjectTypes.map((subjectType) =>
            bodyOperationalStore.listSubjects(userId, subjectType),
          ),
        )
      ).flat();
      if (manualUmbrellas.has(umbrella.id)) {
        const manualSubjects = await bodyOperationalStore.listSubjects(
          userId,
          "manual_observation",
        );
        subjects.push(
          ...manualSubjects.filter((subject) =>
            subject.entityId.startsWith(`${umbrella.id}:`),
          ),
        );
      }
      histories = (
        await Promise.all(
          subjects.map((subject) =>
            bodyOperationalStore.getSubjectHistory(userId, subject.id),
          ),
        )
      ).filter((history) => history !== null);
    } catch (error) {
      storageAvailable = false;
      console.error("Body umbrella operational history unavailable:", error);
    }
    const records = histories
      .flatMap((history) =>
        history.executions.map((execution) => ({
          id: execution.id,
          subjectId: history.subject.id,
          label: history.subject.titleSnapshot,
          subjectType: history.subject.subjectType,
          source: execution.source,
          status: execution.status,
          at: execution.actualStartAt ?? execution.createdAt,
          endAt: execution.actualEndAt,
          domainRecordType: execution.domainRecordType,
          domainRecordId: execution.domainRecordId,
          evidence: execution.evidence,
          privacyClass: history.subject.privacyClass,
        })),
      )
      .sort((left, right) => (
        new Date(right.at).getTime() - new Date(left.at).getTime()
      ));
    const plans = histories
      .flatMap((history) =>
        history.commitments.map((commitment) => ({
          id: commitment.id,
          subjectId: history.subject.id,
          label: history.subject.titleSnapshot,
          localDate: commitment.localDate,
          plannedStartAt: commitment.plannedStartAt,
          plannedEndAt: commitment.plannedEndAt,
          status: commitment.status,
          source: commitment.source,
        })),
      );

    const history = metricHistory.map(serializeMetricResult);
    res.json({
      umbrella,
      metricId,
      lens: manualUmbrellas.has(umbrella.id)
        ? "observation"
        : records.length > 0 || plans.length > 0
          ? "operational"
          : history.length > 0
            ? "metric"
            : umbrella.disposition.includes("action")
              ? "operational"
              : "metric",
      storageAvailable,
      current: history[0] ?? null,
      history,
      records,
      plans,
      sources: Array.from(new Set([
        ...history.map((item: ReturnType<typeof serializeMetricResult>) => item.source).filter(Boolean),
        ...records.map((item) => item.source).filter(Boolean),
      ])),
    });
  });

  app.get("/api/body/metrics/:metricId/latest", async (req, res) => {
    const userId = requireAuthenticatedUserId(req);
    if (!userId) return res.sendStatus(401);

    const metricId = req.params.metricId;
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(metricId)) {
      return res.status(400).json({ message: "Invalid metric ID" });
    }

    try {
      const readModel = await getBodyMetricResultReadModel(userId, metricId);
      if (!readModel) {
        return res.json({
          metricId,
          state: "awaiting_data",
          value: null,
          unit: null,
          localDate: null,
          coverageRatio: null,
          generatedAt: null,
          sourceNamespace: null,
          uncertainty: [],
          contributions: [],
        });
      }

      const { result, observations } = readModel;
      const value =
        result.numericValue !== null
          ? Number(result.numericValue)
          : result.textValue ?? result.structuredValue ?? null;

      res.json({
        metricId: result.metricId,
        specificationVersion: result.specificationVersion,
        disposition: result.disposition,
        state: result.state,
        value,
        unit: result.canonicalUnit,
        localDate: result.localDate,
        coverageRatio:
          result.coverageRatio === null
            ? null
            : Number(result.coverageRatio),
        freshUntil: result.freshUntil,
        generatedAt: result.generatedAt,
        sourceNamespace: result.sourceNamespace,
        uncertainty: result.uncertainty,
        contributions: observations.map(
          (observation: {
            id: string;
            numericValue: string | null;
            canonicalUnit: string | null;
            observedAt: Date | null;
            intervalStart: Date | null;
            intervalEnd: Date | null;
            localDate: string | null;
            timezone: string | null;
            providerId: string;
            sourceAppId: string | null;
            sourceDeviceId: string | null;
          }) => ({
            id: observation.id,
            value:
              observation.numericValue === null
                ? null
                : Number(observation.numericValue),
            unit: observation.canonicalUnit,
            observedAt: observation.observedAt,
            intervalStart: observation.intervalStart,
            intervalEnd: observation.intervalEnd,
            localDate: observation.localDate,
            timezone: observation.timezone,
            providerId: observation.providerId,
            sourceAppId: observation.sourceAppId,
            sourceDeviceId: observation.sourceDeviceId,
          }),
        ),
      });
    } catch (error) {
      console.error("Body metric result unavailable:", error);
      res.status(503).json({
        metricId,
        state: "error",
        value: null,
        message: "Canonical Body storage is not available",
      });
    }
  });

  const legacyGone = (_req: Request, res: Response) => {
    res.status(410).json({
      code: "legacy_health_route_disabled",
      message:
        "This legacy health route was disabled because it cannot preserve production-grade provenance and authorization.",
    });
  };

  app.get("/api/health-sync/google-fit/auth", legacyGone);
  app.get("/api/health-sync/google-fit/callback", legacyGone);
  app.post("/api/health-sync/apple-webhook/generate-token", legacyGone);
  app.post("/api/health-sync/apple-webhook/:token", legacyGone);
}
