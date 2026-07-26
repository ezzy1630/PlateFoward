/**
 * Agent trace data model.
 *
 * The trace records the orchestration sequence
 *   analyze_food -> check_safety -> rank_recipients -> create_offer
 * with enough metadata to distinguish the actor at each step.
 *
 * Design rules:
 * - Gemma only ever executes `analyze_food`. It never declares food safe.
 * - `check_safety` is deterministic application logic driven by donor confirmations.
 * - `rank_recipients` is the deterministic TypeScript matcher.
 * - `create_offer` is a Convex mutation.
 * - `fallback` marks application-level demo fallback behaviour.
 */

export type TraceActor =
  | "gemma"
  | "app"
  | "convex"
  | "fallback"
  | "donor";

export type TraceStepName =
  | "analyze_food"
  | "check_safety"
  | "rank_recipients"
  | "create_offer";

export type TraceStatus = "pending" | "running" | "success" | "failure" | "retry";

export interface TraceEvent {
  id: string;
  step: TraceStepName;
  actor: TraceActor;
  status: TraceStatus;
  /** ISO timestamp when the event was created. */
  timestamp: string;
  /** Human-readable label for the step. */
  label: string;
  /** Concise inputs shown to the user. May include non-sensitive context only. */
  input?: Record<string, unknown>;
  /** Concise output shown to the user. */
  output?: Record<string, unknown>;
  /** Error or fallback note when status is failure/retry/fallback. */
  message?: string;
}

export interface AgentTrace {
  events: TraceEvent[];
}

export function createEmptyTrace(): AgentTrace {
  return { events: [] };
}

export function makeTraceId(): string {
  return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function pushTraceEvent(
  trace: AgentTrace,
  event: Omit<TraceEvent, "id" | "timestamp">
): AgentTrace {
  return {
    ...trace,
    events: [
      ...trace.events,
      {
        ...event,
        id: makeTraceId(),
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function updateTraceEvent(
  trace: AgentTrace,
  step: TraceStepName,
  updates: Partial<Omit<TraceEvent, "id" | "step" | "timestamp">>
): AgentTrace {
  const events = [...trace.events];
  const index = events.findLastIndex((e) => e.step === step);
  if (index === -1) return trace;
  events[index] = { ...events[index], ...updates };
  return { ...trace, events };
}

export function getTraceSequence(trace: AgentTrace): TraceStepName[] {
  return trace.events.map((e) => e.step);
}

const STEP_LABELS: Record<TraceStepName, string> = {
  analyze_food: "Analyze food image",
  check_safety: "Check safety confirmations",
  rank_recipients: "Rank recipients",
  create_offer: "Create offer",
};

export function getTraceStepLabel(step: TraceStepName): string {
  return STEP_LABELS[step];
}

export const TRACE_STEPS: TraceStepName[] = [
  "analyze_food",
  "check_safety",
  "rank_recipients",
  "create_offer",
];
