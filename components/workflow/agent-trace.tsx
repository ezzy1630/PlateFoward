"use client";

import { useMemo } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import {
  Brain,
  ShieldCheck,
  Users,
  Ticket,
  Check,
  X,
  ArrowClockwise,
  Hourglass,
  Robot,
  HardDrives,
  AppWindow,
  Warning,
} from "@phosphor-icons/react";
import {
  type AgentTrace as AgentTraceModel,
  type TraceStepName,
  type TraceActor,
  type TraceStatus,
  TRACE_STEPS,
  getTraceStepLabel,
} from "@/lib/agent-trace/types";
import { Card, CardContent } from "@/components/ui/card";

interface AgentTraceProps {
  trace: AgentTraceModel;
  className?: string;
}

const STEP_ICONS: Record<TraceStepName, typeof Brain> = {
  analyze_food: Brain,
  check_safety: ShieldCheck,
  rank_recipients: Users,
  create_offer: Ticket,
};

const ACTOR_LABELS: Record<TraceActor, string> = {
  gemma: "Gemma",
  app: "App",
  convex: "Convex",
  fallback: "Cached sample",
  donor: "Donor",
};

const STATUS_CONFIG: Record<
  TraceStatus,
  { label: string; color: string; bg: string; icon: typeof Check }
> = {
  pending: {
    label: "Pending",
    color: "text-fog-600",
    bg: "bg-fog-200",
    icon: Hourglass,
  },
  running: {
    label: "Running",
    color: "text-orange",
    bg: "bg-orange-100",
    icon: ArrowClockwise,
  },
  success: {
    label: "Success",
    color: "text-success",
    bg: "bg-navy-100",
    icon: Check,
  },
  failure: {
    label: "Failed",
    color: "text-error",
    bg: "bg-error-100",
    icon: X,
  },
  retry: {
    label: "Retry",
    color: "text-warning",
    bg: "bg-orange-100",
    icon: ArrowClockwise,
  },
};

const ACTOR_ICON: Record<TraceActor, typeof Robot> = {
  gemma: Robot,
  app: AppWindow,
  convex: HardDrives,
  fallback: Warning,
  donor: AppWindow,
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function AgentTrace({ trace, className }: AgentTraceProps) {
  const reduce = useReducedMotion();

  const eventsByStep = useMemo(() => {
    const map = new Map<TraceStepName, (typeof trace.events)[number]>();
    for (const event of trace.events) {
      map.set(event.step, event);
    }
    return map;
  }, [trace]);

  return (
    <Card variant="bordered" className={className}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-navy">
            Agent trace
          </h3>
          <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
            Orchestration
          </span>
        </div>

        <p className="text-xs leading-relaxed text-fog-600">
          Each step shows the actor, status, and concise output. Safety and
          matching are deterministic application logic; Gemma only analyzes the
          image.
        </p>

        <ol className="relative space-y-3" aria-label="Agent trace steps">
          {TRACE_STEPS.map((step, index) => {
            const event = eventsByStep.get(step);
            const isLast = index === TRACE_STEPS.length - 1;
            const StatusIcon = event
              ? STATUS_CONFIG[event.status].icon
              : Hourglass;
            const statusCfg = event ? STATUS_CONFIG[event.status] : STATUS_CONFIG.pending;
            const StepIcon = STEP_ICONS[step];

            return (
              <li
                key={step}
                className="relative pl-8"
                aria-current={!event ? "step" : undefined}
              >
                {!isLast && (
                  <span
                    className="absolute left-[15px] top-7 h-full w-px bg-navy-100"
                    aria-hidden="true"
                  />
                )}

                <div className="absolute left-0 top-0.5">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      event
                        ? `${statusCfg.bg} border-current ${statusCfg.color}`
                        : "border-navy-200 bg-surface text-fog-600"
                    }`}
                  >
                    {event ? (
                      <StatusIcon size={16} weight="bold" />
                    ) : (
                      <StepIcon size={16} />
                    )}
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  <motion.div
                    initial={false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { duration: 0.25, delay: index * 0.05 }
                    }
                  >
                    <div className="rounded-lg border border-navy-100 bg-surface p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-display text-sm font-semibold text-navy">
                            {getTraceStepLabel(step)}
                          </span>
                          {event && (
                            <span className="mt-1 block font-mono text-[0.625rem] text-fog-600">
                              {formatTime(event.timestamp)}
                            </span>
                          )}
                        </div>

                        {event ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-fog-200 px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-wider text-fog-600">
                            Pending
                          </span>
                        )}
                      </div>

                      {event && (
                        <div className="mt-2 space-y-1 border-t border-navy-100 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.625rem] text-fog-600 uppercase tracking-wider">
                              Actor
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-navy">
                              {(() => {
                                const Icon = ACTOR_ICON[event.actor];
                                return <Icon size={12} />;
                              })()}
                              {ACTOR_LABELS[event.actor]}
                            </span>
                          </div>

                          {event.output && Object.keys(event.output).length > 0 && (
                            <dl className="space-y-0.5" aria-label={`${event.step} output`}>
                              {Object.entries(event.output).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <dt className="font-mono text-[0.625rem] text-fog-600 capitalize">
                                    {key}:
                                  </dt>
                                  <dd className="text-navy">
                                    {Array.isArray(value)
                                      ? value.join(", ")
                                      : String(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}

                          {event.message && (
                            <p className="text-xs text-fog-600">{event.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
