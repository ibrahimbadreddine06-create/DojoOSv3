import { randomUUID } from "node:crypto";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "./db";
import {
  activityDefinitions,
  bodyCommitments,
  bodyExecutions,
  bodyGoalEvents,
  bodyGoalLinks,
  bodyReconciliations,
  bodySubjects,
  insertBodyCommitmentSchema,
  insertBodyExecutionSchema,
  insertBodyGoalEventSchema,
  insertBodyGoalLinkSchema,
  insertBodyReconciliationSchema,
  insertBodySubjectSchema,
  insertActivityDefinitionSchema,
  type ActivityDefinition,
  type BodyCommitment,
  type BodyExecution,
  type BodyGoalEvent,
  type BodyGoalLink,
  type BodyReconciliation,
  type BodySubject,
  type InsertBodyCommitment,
  type InsertBodyExecution,
  type InsertBodyGoalEvent,
  type InsertBodyGoalLink,
  type InsertBodyReconciliation,
  type InsertBodySubject,
  type InsertActivityDefinition,
} from "../shared/schema";

type OperationalSnapshot = {
  subjects: BodySubject[];
  commitments: BodyCommitment[];
  executions: BodyExecution[];
};

export type SubjectHistory = {
  subject: BodySubject;
  commitments: BodyCommitment[];
  executions: BodyExecution[];
  reconciliations: BodyReconciliation[];
};

type BodyGoalProgress = {
  goalLinkId: string;
  contribution: number;
  target: number | null;
  unit: string | null;
  progressRatio: number | null;
  evidenceCount: number;
};

const initialActivityDefinitions: Array<
  Omit<InsertActivityDefinition, "userId">
> = [
  { slug: "run", name: "Run", category: "endurance", supportedFields: ["duration", "distance", "effort"], source: "curated" },
  { slug: "walk", name: "Walk", category: "movement", supportedFields: ["duration", "distance", "effort"], source: "curated" },
  { slug: "cycle", name: "Cycle", category: "endurance", supportedFields: ["duration", "distance", "effort"], source: "curated" },
  { slug: "swim", name: "Swim", category: "endurance", supportedFields: ["duration", "distance", "effort"], source: "curated" },
  { slug: "sport", name: "Sport", category: "sport", supportedFields: ["duration", "effort"], source: "curated" },
  { slug: "workout", name: "Workout", category: "workout", supportedFields: ["duration", "effort"], source: "curated" },
];

export interface BodyOperationalStore {
  ensureInitialActivityDefinitions(): Promise<ActivityDefinition[]>;
  createActivityDefinition(
    input: InsertActivityDefinition,
  ): Promise<ActivityDefinition>;
  listActivityDefinitions(userId: string): Promise<ActivityDefinition[]>;
  getActivityDefinition(
    userId: string,
    id: string,
  ): Promise<ActivityDefinition | null>;
  createSubject(input: InsertBodySubject): Promise<BodySubject>;
  getSubject(userId: string, id: string): Promise<BodySubject | null>;
  listSubjects(userId: string, subjectType?: string): Promise<BodySubject[]>;
  getSubjectHistory(userId: string, subjectId: string): Promise<SubjectHistory | null>;
  createCommitment(input: InsertBodyCommitment): Promise<BodyCommitment>;
  updateCommitment(
    userId: string,
    id: string,
    input: Partial<InsertBodyCommitment>,
  ): Promise<BodyCommitment | null>;
  createExecution(input: InsertBodyExecution): Promise<BodyExecution>;
  getExecution(userId: string, id: string): Promise<BodyExecution | null>;
  getExecutionByDomainRecord(
    userId: string,
    domainRecordType: string,
    domainRecordId: string,
  ): Promise<BodyExecution | null>;
  updateExecution(
    userId: string,
    id: string,
    input: Partial<InsertBodyExecution>,
  ): Promise<BodyExecution | null>;
  createReconciliation(
    input: InsertBodyReconciliation,
  ): Promise<BodyReconciliation>;
  createGoalLink(input: InsertBodyGoalLink): Promise<BodyGoalLink>;
  createGoalEvent(input: InsertBodyGoalEvent): Promise<BodyGoalEvent>;
  getGoalProgress(
    userId: string,
    goalLinkId: string,
  ): Promise<BodyGoalProgress | null>;
  getSnapshot(
    userId: string,
    localDate: string,
    subjectType?: string,
  ): Promise<OperationalSnapshot>;
}

function assertOwnedSubject(
  subject: BodySubject | undefined,
  userId: string,
): asserts subject is BodySubject {
  if (!subject || subject.userId !== userId) {
    throw new Error("Body subject not found");
  }
}

export class MemoryBodyOperationalStore implements BodyOperationalStore {
  private activityDefinitions = new Map<string, ActivityDefinition>();
  private subjects = new Map<string, BodySubject>();
  private commitments = new Map<string, BodyCommitment>();
  private executions = new Map<string, BodyExecution>();
  private reconciliations = new Map<string, BodyReconciliation>();
  private goalLinks = new Map<string, BodyGoalLink>();
  private goalEvents = new Map<string, BodyGoalEvent>();

  async ensureInitialActivityDefinitions() {
    return Promise.all(
      initialActivityDefinitions.map((definition) =>
        this.createActivityDefinition({ ...definition, userId: null }),
      ),
    );
  }

  async createActivityDefinition(input: InsertActivityDefinition) {
    const parsed = insertActivityDefinitionSchema.parse(input);
    const existing = Array.from(this.activityDefinitions.values()).find(
      (definition) =>
        definition.userId === parsed.userId &&
        definition.slug === parsed.slug,
    );
    if (existing) return existing;
    const now = new Date();
    const definition: ActivityDefinition = {
      ...parsed,
      id: randomUUID(),
      userId: parsed.userId ?? null,
      aliases: parsed.aliases ?? [],
      category: parsed.category ?? null,
      supportedFields: parsed.supportedFields ?? [],
      instructions: parsed.instructions ?? null,
      imageUrl: parsed.imageUrl ?? null,
      source: parsed.source ?? "curated",
      archivedAt: parsed.archivedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.activityDefinitions.set(definition.id, definition);
    return definition;
  }

  async listActivityDefinitions(userId: string) {
    return Array.from(this.activityDefinitions.values()).filter(
      (definition) =>
        definition.userId === null || definition.userId === userId,
    );
  }

  async getActivityDefinition(userId: string, id: string) {
    const definition = this.activityDefinitions.get(id);
    if (
      !definition ||
      (definition.userId !== null && definition.userId !== userId)
    ) {
      return null;
    }
    return definition;
  }

  async createSubject(input: InsertBodySubject): Promise<BodySubject> {
    const parsed = insertBodySubjectSchema.parse(input);
    const existing = Array.from(this.subjects.values()).find(
      (subject) =>
        subject.userId === parsed.userId &&
        subject.subjectType === parsed.subjectType &&
        subject.entityId === parsed.entityId,
    );
    if (existing) return existing;

    const subject: BodySubject = {
      ...parsed,
      id: randomUUID(),
      titleSnapshot: parsed.titleSnapshot ?? null,
      privacyClass: parsed.privacyClass ?? "general_wellness",
      source: parsed.source ?? "body",
      createdAt: new Date(),
      archivedAt: parsed.archivedAt ?? null,
    };
    this.subjects.set(subject.id, subject);
    return subject;
  }

  async getSubject(userId: string, id: string) {
    const subject = this.subjects.get(id);
    return subject?.userId === userId ? subject : null;
  }

  async listSubjects(userId: string, subjectType?: string) {
    return Array.from(this.subjects.values()).filter(
      (subject) =>
        subject.userId === userId &&
        (!subjectType || subject.subjectType === subjectType),
    );
  }

  async getSubjectHistory(userId: string, subjectId: string) {
    const subject = this.subjects.get(subjectId);
    if (!subject || subject.userId !== userId) return null;
    const commitments = Array.from(this.commitments.values()).filter(
      (item) => item.userId === userId && item.subjectId === subjectId,
    );
    const commitmentIds = new Set(commitments.map((item) => item.id));
    const executions = Array.from(this.executions.values()).filter(
      (item) => item.userId === userId && item.subjectId === subjectId,
    );
    const executionIds = new Set(executions.map((item) => item.id));
    const reconciliations = Array.from(this.reconciliations.values()).filter(
      (item) =>
        item.userId === userId &&
        (commitmentIds.has(item.commitmentId) || executionIds.has(item.executionId)),
    );
    return { subject, commitments, executions, reconciliations };
  }

  async createCommitment(input: InsertBodyCommitment): Promise<BodyCommitment> {
    const parsed = insertBodyCommitmentSchema.parse(input);
    assertOwnedSubject(this.subjects.get(parsed.subjectId), parsed.userId);

    if (parsed.plannerBlockId) {
      const duplicate = Array.from(this.commitments.values()).find(
        (commitment) => commitment.plannerBlockId === parsed.plannerBlockId,
      );
      if (duplicate) return duplicate;
    }

    const now = new Date();
    const commitment: BodyCommitment = {
      ...parsed,
      id: randomUUID(),
      localDate: parsed.localDate ?? null,
      plannedStartAt: parsed.plannedStartAt ?? null,
      plannedEndAt: parsed.plannedEndAt ?? null,
      timezone: parsed.timezone ?? null,
      recurrenceRuleId: parsed.recurrenceRuleId ?? null,
      plannerBlockId: parsed.plannerBlockId ?? null,
      status: parsed.status ?? "planned",
      source: parsed.source ?? "body",
      sourceReference: parsed.sourceReference ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.commitments.set(commitment.id, commitment);
    return commitment;
  }

  async updateCommitment(
    userId: string,
    id: string,
    input: Partial<InsertBodyCommitment>,
  ) {
    const current = this.commitments.get(id);
    if (!current || current.userId !== userId) return null;
    const parsed = insertBodyCommitmentSchema.parse({
      ...current,
      ...input,
      userId,
      subjectId: current.subjectId,
    });
    const updated: BodyCommitment = {
      ...current,
      ...parsed,
      id,
      updatedAt: new Date(),
    };
    this.commitments.set(id, updated);
    return updated;
  }

  async createExecution(input: InsertBodyExecution): Promise<BodyExecution> {
    const parsed = insertBodyExecutionSchema.parse(input);
    assertOwnedSubject(this.subjects.get(parsed.subjectId), parsed.userId);

    if (parsed.commitmentId) {
      const commitment = this.commitments.get(parsed.commitmentId);
      if (!commitment || commitment.userId !== parsed.userId) {
        throw new Error("Body commitment not found");
      }
    }

    if (parsed.domainRecordType && parsed.domainRecordId) {
      const duplicate = Array.from(this.executions.values()).find(
        (execution) =>
          execution.userId === parsed.userId &&
          execution.domainRecordType === parsed.domainRecordType &&
          execution.domainRecordId === parsed.domainRecordId,
      );
      if (duplicate) return duplicate;
    }

    const now = new Date();
    const execution: BodyExecution = {
      ...parsed,
      id: randomUUID(),
      commitmentId: parsed.commitmentId ?? null,
      status: parsed.status ?? "ready",
      actualStartAt: parsed.actualStartAt ?? null,
      actualEndAt: parsed.actualEndAt ?? null,
      timezone: parsed.timezone ?? null,
      source: parsed.source ?? "manual",
      domainRecordType: parsed.domainRecordType ?? null,
      domainRecordId: parsed.domainRecordId ?? null,
      evidence: parsed.evidence ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.executions.set(execution.id, execution);
    return execution;
  }

  async getExecution(userId: string, id: string) {
    const execution = this.executions.get(id);
    return execution?.userId === userId ? execution : null;
  }

  async getExecutionByDomainRecord(
    userId: string,
    domainRecordType: string,
    domainRecordId: string,
  ) {
    return (
      Array.from(this.executions.values()).find(
        (execution) =>
          execution.userId === userId &&
          execution.domainRecordType === domainRecordType &&
          execution.domainRecordId === domainRecordId,
      ) ?? null
    );
  }

  async updateExecution(
    userId: string,
    id: string,
    input: Partial<InsertBodyExecution>,
  ) {
    const current = this.executions.get(id);
    if (!current || current.userId !== userId) return null;

    const parsed = insertBodyExecutionSchema.parse({
      ...current,
      ...input,
      userId,
      subjectId: current.subjectId,
    });
    const updated: BodyExecution = {
      ...current,
      ...parsed,
      id,
      updatedAt: new Date(),
    };
    this.executions.set(id, updated);
    return updated;
  }

  async createReconciliation(input: InsertBodyReconciliation) {
    const parsed = insertBodyReconciliationSchema.parse(input);
    const commitment = this.commitments.get(parsed.commitmentId);
    const execution = this.executions.get(parsed.executionId);
    if (
      !commitment ||
      !execution ||
      commitment.userId !== parsed.userId ||
      execution.userId !== parsed.userId ||
      commitment.subjectId !== execution.subjectId
    ) {
      throw new Error("Commitment and execution cannot be reconciled");
    }

    const existing = Array.from(this.reconciliations.values()).find(
      (item) =>
        item.commitmentId === parsed.commitmentId &&
        item.executionId === parsed.executionId,
    );
    if (existing) return existing;

    const reconciliation: BodyReconciliation = {
      ...parsed,
      id: randomUUID(),
      confidence: parsed.confidence ?? null,
      confirmedByUser: parsed.confirmedByUser ?? false,
      reason: parsed.reason ?? null,
      createdAt: new Date(),
    };
    this.reconciliations.set(reconciliation.id, reconciliation);
    return reconciliation;
  }

  async createGoalLink(input: InsertBodyGoalLink) {
    const parsed = insertBodyGoalLinkSchema.parse(input);
    if (parsed.subjectId) {
      assertOwnedSubject(this.subjects.get(parsed.subjectId), parsed.userId);
    }
    const link: BodyGoalLink = {
      ...parsed,
      id: randomUUID(),
      subjectId: parsed.subjectId ?? null,
      canonicalType: parsed.canonicalType ?? null,
      targetValue: parsed.targetValue ?? null,
      targetUnit: parsed.targetUnit ?? null,
      validFrom: parsed.validFrom ?? null,
      validTo: parsed.validTo ?? null,
      createdAt: new Date(),
    };
    this.goalLinks.set(link.id, link);
    return link;
  }

  async createGoalEvent(input: InsertBodyGoalEvent) {
    const parsed = insertBodyGoalEventSchema.parse(input);
    const link = this.goalLinks.get(parsed.goalLinkId);
    if (!link || link.userId !== parsed.userId) {
      throw new Error("Body goal link not found");
    }
    if (parsed.executionId) {
      const execution = this.executions.get(parsed.executionId);
      if (!execution || execution.userId !== parsed.userId) {
        throw new Error("Goal execution evidence not found");
      }
    }
    const event: BodyGoalEvent = {
      ...parsed,
      id: randomUUID(),
      executionId: parsed.executionId ?? null,
      observationId: parsed.observationId ?? null,
      reversedAt: parsed.reversedAt ?? null,
      reversalReason: parsed.reversalReason ?? null,
      createdAt: new Date(),
    };
    this.goalEvents.set(event.id, event);
    return event;
  }

  async getGoalProgress(userId: string, goalLinkId: string) {
    const link = this.goalLinks.get(goalLinkId);
    if (!link || link.userId !== userId) return null;
    const evidence = Array.from(this.goalEvents.values()).filter(
      (event) =>
        event.userId === userId &&
        event.goalLinkId === goalLinkId &&
        !event.reversedAt,
    );
    const contribution = evidence.reduce(
      (sum, event) => sum + Number(event.contribution),
      0,
    );
    const target = link.targetValue === null ? null : Number(link.targetValue);
    return {
      goalLinkId,
      contribution,
      target,
      unit: link.targetUnit,
      progressRatio:
        target !== null && target !== 0 ? contribution / target : null,
      evidenceCount: evidence.length,
    };
  }

  async getSnapshot(
    userId: string,
    localDate: string,
    subjectType?: string,
  ): Promise<OperationalSnapshot> {
    const subjects = await this.listSubjects(userId, subjectType);
    const subjectIds = new Set(subjects.map((subject) => subject.id));
    const commitments = Array.from(this.commitments.values()).filter(
      (commitment) =>
        commitment.userId === userId &&
        commitment.localDate === localDate &&
        subjectIds.has(commitment.subjectId),
    );
    const executionCommitmentIds = new Set(
      commitments.map((commitment) => commitment.id),
    );
    const executions = Array.from(this.executions.values()).filter(
      (execution) =>
        execution.userId === userId &&
        subjectIds.has(execution.subjectId) &&
        (execution.commitmentId
          ? executionCommitmentIds.has(execution.commitmentId)
          : execution.actualStartAt?.toISOString().slice(0, 10) === localDate),
    );
    return { subjects, commitments, executions };
  }
}

class DatabaseBodyOperationalStore implements BodyOperationalStore {
  private database() {
    if (!db) throw new Error("Body operational storage requires DATABASE_URL");
    return db;
  }

  async ensureInitialActivityDefinitions() {
    return Promise.all(
      initialActivityDefinitions.map((definition) =>
        this.createActivityDefinition({ ...definition, userId: null }),
      ),
    );
  }

  async createActivityDefinition(input: InsertActivityDefinition) {
    const parsed = insertActivityDefinitionSchema.parse(input);
    const database = this.database();
    const [existing] = await database
      .select()
      .from(activityDefinitions)
      .where(
        and(
          parsed.userId
            ? eq(activityDefinitions.userId, parsed.userId)
            : isNull(activityDefinitions.userId),
          eq(activityDefinitions.slug, parsed.slug),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const [created] = await database
      .insert(activityDefinitions)
      .values(parsed)
      .returning();
    return created;
  }

  async listActivityDefinitions(userId: string) {
    return this.database()
      .select()
      .from(activityDefinitions)
      .where(
        or(
          isNull(activityDefinitions.userId),
          eq(activityDefinitions.userId, userId),
        ),
      );
  }

  async getActivityDefinition(userId: string, id: string) {
    const [definition] = await this.database()
      .select()
      .from(activityDefinitions)
      .where(
        and(
          eq(activityDefinitions.id, id),
          or(
            isNull(activityDefinitions.userId),
            eq(activityDefinitions.userId, userId),
          ),
        ),
      )
      .limit(1);
    return definition ?? null;
  }

  async createSubject(input: InsertBodySubject) {
    const parsed = insertBodySubjectSchema.parse(input);
    const database = this.database();
    const [existing] = await database
      .select()
      .from(bodySubjects)
      .where(
        and(
          eq(bodySubjects.userId, parsed.userId),
          eq(bodySubjects.subjectType, parsed.subjectType),
          eq(bodySubjects.entityId, parsed.entityId),
        ),
      )
      .limit(1);
    if (existing) return existing;
    const [created] = await database.insert(bodySubjects).values(parsed).returning();
    return created;
  }

  async getSubject(userId: string, id: string) {
    const [subject] = await this.database()
      .select()
      .from(bodySubjects)
      .where(and(eq(bodySubjects.id, id), eq(bodySubjects.userId, userId)))
      .limit(1);
    return subject ?? null;
  }

  async listSubjects(userId: string, subjectType?: string) {
    const database = this.database();
    return database
      .select()
      .from(bodySubjects)
      .where(
        subjectType
          ? and(
              eq(bodySubjects.userId, userId),
              eq(bodySubjects.subjectType, subjectType),
            )
          : eq(bodySubjects.userId, userId),
      );
  }

  async getSubjectHistory(userId: string, subjectId: string) {
    const subject = await this.getSubject(userId, subjectId);
    if (!subject) return null;
    const database = this.database();
    const commitments = await database.select().from(bodyCommitments).where(
      and(eq(bodyCommitments.userId, userId), eq(bodyCommitments.subjectId, subjectId)),
    );
    const executions = await database.select().from(bodyExecutions).where(
      and(eq(bodyExecutions.userId, userId), eq(bodyExecutions.subjectId, subjectId)),
    );
    const reconciliations = await database.select().from(bodyReconciliations).where(
      eq(bodyReconciliations.userId, userId),
    );
    const commitmentIds = new Set(commitments.map((item: BodyCommitment) => item.id));
    const executionIds = new Set(executions.map((item: BodyExecution) => item.id));
    return {
      subject,
      commitments,
      executions,
      reconciliations: reconciliations.filter(
        (item: BodyReconciliation) =>
          commitmentIds.has(item.commitmentId) ||
          executionIds.has(item.executionId),
      ),
    };
  }

  private async requireSubject(userId: string, subjectId: string) {
    const [subject] = await this.database()
      .select()
      .from(bodySubjects)
      .where(
        and(eq(bodySubjects.id, subjectId), eq(bodySubjects.userId, userId)),
      )
      .limit(1);
    assertOwnedSubject(subject, userId);
    return subject;
  }

  async createCommitment(input: InsertBodyCommitment) {
    const parsed = insertBodyCommitmentSchema.parse(input);
    await this.requireSubject(parsed.userId, parsed.subjectId);
    const database = this.database();
    if (parsed.plannerBlockId) {
      const [existing] = await database
        .select()
        .from(bodyCommitments)
        .where(eq(bodyCommitments.plannerBlockId, parsed.plannerBlockId))
        .limit(1);
      if (existing) return existing;
    }
    const [created] = await database
      .insert(bodyCommitments)
      .values(parsed)
      .returning();
    return created;
  }

  async updateCommitment(
    userId: string,
    id: string,
    input: Partial<InsertBodyCommitment>,
  ) {
    const database = this.database();
    const [current] = await database
      .select()
      .from(bodyCommitments)
      .where(
        and(eq(bodyCommitments.id, id), eq(bodyCommitments.userId, userId)),
      )
      .limit(1);
    if (!current) return null;
    const parsed = insertBodyCommitmentSchema.parse({
      ...current,
      ...input,
      userId,
      subjectId: current.subjectId,
    });
    const [updated] = await database
      .update(bodyCommitments)
      .set({ ...parsed, updatedAt: new Date() })
      .where(
        and(eq(bodyCommitments.id, id), eq(bodyCommitments.userId, userId)),
      )
      .returning();
    return updated ?? null;
  }

  async createExecution(input: InsertBodyExecution) {
    const parsed = insertBodyExecutionSchema.parse(input);
    await this.requireSubject(parsed.userId, parsed.subjectId);
    const database = this.database();
    if (parsed.commitmentId) {
      const [commitment] = await database
        .select()
        .from(bodyCommitments)
        .where(
          and(
            eq(bodyCommitments.id, parsed.commitmentId),
            eq(bodyCommitments.userId, parsed.userId),
          ),
        )
        .limit(1);
      if (!commitment) throw new Error("Body commitment not found");
    }
    if (parsed.domainRecordType && parsed.domainRecordId) {
      const [existing] = await database
        .select()
        .from(bodyExecutions)
        .where(
          and(
            eq(bodyExecutions.userId, parsed.userId),
            eq(bodyExecutions.domainRecordType, parsed.domainRecordType),
            eq(bodyExecutions.domainRecordId, parsed.domainRecordId),
          ),
        )
        .limit(1);
      if (existing) return existing;
    }
    const [created] = await database.insert(bodyExecutions).values(parsed).returning();
    return created;
  }

  async getExecution(userId: string, id: string) {
    const [execution] = await this.database()
      .select()
      .from(bodyExecutions)
      .where(
        and(eq(bodyExecutions.id, id), eq(bodyExecutions.userId, userId)),
      )
      .limit(1);
    return execution ?? null;
  }

  async getExecutionByDomainRecord(
    userId: string,
    domainRecordType: string,
    domainRecordId: string,
  ) {
    const [execution] = await this.database()
      .select()
      .from(bodyExecutions)
      .where(
        and(
          eq(bodyExecutions.userId, userId),
          eq(bodyExecutions.domainRecordType, domainRecordType),
          eq(bodyExecutions.domainRecordId, domainRecordId),
        ),
      )
      .limit(1);
    return execution ?? null;
  }

  async updateExecution(
    userId: string,
    id: string,
    input: Partial<InsertBodyExecution>,
  ) {
    const database = this.database();
    const [current] = await database
      .select()
      .from(bodyExecutions)
      .where(and(eq(bodyExecutions.id, id), eq(bodyExecutions.userId, userId)))
      .limit(1);
    if (!current) return null;
    const parsed = insertBodyExecutionSchema.parse({
      ...current,
      ...input,
      userId,
      subjectId: current.subjectId,
    });
    const [updated] = await database
      .update(bodyExecutions)
      .set({ ...parsed, updatedAt: new Date() })
      .where(and(eq(bodyExecutions.id, id), eq(bodyExecutions.userId, userId)))
      .returning();
    return updated ?? null;
  }

  async createReconciliation(input: InsertBodyReconciliation) {
    const parsed = insertBodyReconciliationSchema.parse(input);
    const database = this.database();
    const [commitment] = await database
      .select()
      .from(bodyCommitments)
      .where(
        and(
          eq(bodyCommitments.id, parsed.commitmentId),
          eq(bodyCommitments.userId, parsed.userId),
        ),
      )
      .limit(1);
    const [execution] = await database
      .select()
      .from(bodyExecutions)
      .where(
        and(
          eq(bodyExecutions.id, parsed.executionId),
          eq(bodyExecutions.userId, parsed.userId),
        ),
      )
      .limit(1);
    if (!commitment || !execution || commitment.subjectId !== execution.subjectId) {
      throw new Error("Commitment and execution cannot be reconciled");
    }
    const [created] = await database
      .insert(bodyReconciliations)
      .values(parsed)
      .onConflictDoNothing()
      .returning();
    if (created) return created;
    const [existing] = await database
      .select()
      .from(bodyReconciliations)
      .where(
        and(
          eq(bodyReconciliations.commitmentId, parsed.commitmentId),
          eq(bodyReconciliations.executionId, parsed.executionId),
        ),
      )
      .limit(1);
    return existing;
  }

  async createGoalLink(input: InsertBodyGoalLink) {
    const parsed = insertBodyGoalLinkSchema.parse(input);
    if (parsed.subjectId) await this.requireSubject(parsed.userId, parsed.subjectId);
    const [created] = await this.database()
      .insert(bodyGoalLinks)
      .values(parsed)
      .returning();
    return created;
  }

  async createGoalEvent(input: InsertBodyGoalEvent) {
    const parsed = insertBodyGoalEventSchema.parse(input);
    const database = this.database();
    const [link] = await database
      .select()
      .from(bodyGoalLinks)
      .where(
        and(
          eq(bodyGoalLinks.id, parsed.goalLinkId),
          eq(bodyGoalLinks.userId, parsed.userId),
        ),
      )
      .limit(1);
    if (!link) throw new Error("Body goal link not found");
    const [created] = await database.insert(bodyGoalEvents).values(parsed).returning();
    return created;
  }

  async getGoalProgress(userId: string, goalLinkId: string) {
    const database = this.database();
    const [link] = await database
      .select()
      .from(bodyGoalLinks)
      .where(
        and(
          eq(bodyGoalLinks.id, goalLinkId),
          eq(bodyGoalLinks.userId, userId),
        ),
      )
      .limit(1);
    if (!link) return null;
    const [aggregate] = await database
      .select({
        contribution: sql<string>`COALESCE(SUM(${bodyGoalEvents.contribution}), 0)`,
        evidenceCount: sql<number>`COUNT(*)::int`,
      })
      .from(bodyGoalEvents)
      .where(
        and(
          eq(bodyGoalEvents.userId, userId),
          eq(bodyGoalEvents.goalLinkId, goalLinkId),
          isNull(bodyGoalEvents.reversedAt),
        ),
      );
    const contribution = Number(aggregate?.contribution ?? 0);
    const target = link.targetValue === null ? null : Number(link.targetValue);
    return {
      goalLinkId,
      contribution,
      target,
      unit: link.targetUnit,
      progressRatio:
        target !== null && target !== 0 ? contribution / target : null,
      evidenceCount: aggregate?.evidenceCount ?? 0,
    };
  }

  async getSnapshot(userId: string, localDate: string, subjectType?: string) {
    const database = this.database();
    const subjects = await this.listSubjects(userId, subjectType);
    if (subjects.length === 0) {
      return { subjects: [], commitments: [], executions: [] };
    }
    const commitments = await database
      .select()
      .from(bodyCommitments)
      .where(
        and(
          eq(bodyCommitments.userId, userId),
          eq(bodyCommitments.localDate, localDate),
        ),
      );
    const executions = await database
      .select()
      .from(bodyExecutions)
      .where(eq(bodyExecutions.userId, userId));
    const subjectIds = new Set(
      subjects.map((subject: BodySubject) => subject.id),
    );
    const commitmentIds = new Set(
      commitments
        .filter((commitment: BodyCommitment) =>
          subjectIds.has(commitment.subjectId),
        )
        .map((commitment: BodyCommitment) => commitment.id),
    );
    return {
      subjects,
      commitments: commitments.filter((commitment: BodyCommitment) =>
        subjectIds.has(commitment.subjectId),
      ),
      executions: executions.filter(
        (execution: BodyExecution) =>
          subjectIds.has(execution.subjectId) &&
          (execution.commitmentId
            ? commitmentIds.has(execution.commitmentId)
            : execution.actualStartAt?.toISOString().slice(0, 10) === localDate),
      ),
    };
  }
}

export const bodyOperationalStore: BodyOperationalStore = db
  ? new DatabaseBodyOperationalStore()
  : new MemoryBodyOperationalStore();

const dateKeys = [
  "plannedStartAt",
  "plannedEndAt",
  "actualStartAt",
  "actualEndAt",
  "validFrom",
  "validTo",
  "occurredAt",
  "reversedAt",
  "archivedAt",
];

export function coerceOperationalDates<T extends Record<string, unknown>>(
  input: T,
): T {
  const result = { ...input };
  for (const key of dateKeys) {
    const value = result[key];
    if (typeof value === "string" && value.length > 0) {
      (result as Record<string, unknown>)[key] = new Date(value);
    }
  }
  return result;
}
