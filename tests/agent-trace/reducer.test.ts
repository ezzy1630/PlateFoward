import { describe, it, expect } from 'vitest';
import {
  workflowReducer,
  initialState,
  type WorkflowState,
} from '@/hooks/useDonationWorkflow';
import type { AgentTrace, TraceStatus } from '@/lib/agent-trace/types';

function makeGemmaResult() {
  return {
    source: 'gemma' as const,
    analysis: {
      foodItems: [{ name: 'Sandwich', category: 'sandwich', estimatedQuantity: 10, confidence: 0.9 }],
      temperatureState: 'refrigerated',
      packagingState: 'sealed',
      pickupRequired: true,
      availableUntil: '2026-07-28T18:30:00.000Z',
      allergens: ['gluten'],
      missingInformation: [],
      conciseExplanation: 'Test',
    },
    trace: {
      model: 'gemma-4-31b',
      timingMs: 123,
      retry: false,
      nativeJsonSchema: true,
    },
  };
}

function getTraceEvent(trace: AgentTrace, step: string) {
  return trace.events.filter((e) => e.step === step).pop();
}

describe('agent trace reducer', () => {
  it('starts with an empty trace', () => {
    expect(initialState.agentTrace.events).toHaveLength(0);
  });

  it('emits analyze_food pending on START_ANALYSIS', () => {
    const next = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    const event = getTraceEvent(next.agentTrace, 'analyze_food');
    expect(event).toBeDefined();
    expect(event?.actor).toBe('gemma');
    expect(event?.status).toBe('pending');
  });

  it('marks analyze_food success on ANALYSIS_SUCCESS', () => {
    let state = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, { type: 'ANALYSIS_SUCCESS', result: makeGemmaResult() });
    const event = getTraceEvent(state.agentTrace, 'analyze_food');
    expect(event?.status).toBe('success');
    expect(event?.actor).toBe('gemma');
  });

  it('marks analyze_food retry on ANALYSIS_ERROR when fallback is available', () => {
    let state = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, {
      type: 'ANALYSIS_ERROR',
      error: 'Service unavailable',
      errorCode: 'UNAVAILABLE',
      canUseFallback: true,
    });
    const event = getTraceEvent(state.agentTrace, 'analyze_food');
    expect(event?.status).toBe('retry');
  });

  it('marks analyze_food failure on ANALYSIS_ERROR when fallback is unavailable', () => {
    let state = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, {
      type: 'ANALYSIS_ERROR',
      error: 'Forbidden',
      errorCode: 'FORBIDDEN',
      canUseFallback: false,
    });
    const event = getTraceEvent(state.agentTrace, 'analyze_food');
    expect(event?.status).toBe('failure');
  });

  it('pushes a fallback analyze_food event on USE_FALLBACK', () => {
    let state = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, { type: 'USE_FALLBACK' });
    const event = getTraceEvent(state.agentTrace, 'analyze_food');
    expect(event?.actor).toBe('fallback');
    expect(event?.status).toBe('success');
    expect(event?.message).toContain('demo sample data');
  });

  it('emits check_safety and rank_recipients on START_MATCHING', () => {
    let state: WorkflowState = {
      ...initialState,
      confirmations: {
        prepTimeLogged: true,
        refrigerationMaintained: true,
        packagingIntact: true,
        notPreviouslyServed: true,
        allergensReviewed: true,
        quantityVerified: true,
        deadlineConfirmed: true,
      },
    };
    state = workflowReducer(state, { type: 'START_MATCHING' });
    expect(getTraceEvent(state.agentTrace, 'check_safety')?.status).toBe('success');
    expect(getTraceEvent(state.agentTrace, 'check_safety')?.actor).toBe('app');
    expect(getTraceEvent(state.agentTrace, 'rank_recipients')?.status).toBe('pending');
  });

  it('never attributes check_safety to gemma', () => {
    let state: WorkflowState = {
      ...initialState,
      confirmations: {
        prepTimeLogged: true,
        refrigerationMaintained: true,
        packagingIntact: true,
        notPreviouslyServed: true,
        allergensReviewed: true,
        quantityVerified: true,
        deadlineConfirmed: true,
      },
    };
    state = workflowReducer(state, { type: 'START_MATCHING' });
    const safetyEvents = state.agentTrace.events.filter((e) => e.step === 'check_safety');
    expect(safetyEvents.every((e) => e.actor !== 'gemma')).toBe(true);
  });

  it('keeps check_safety actor as app even when safety checks fail', () => {
    const state = workflowReducer(initialState, { type: 'START_MATCHING' });
    const event = getTraceEvent(state.agentTrace, 'check_safety');
    expect(event?.actor).toBe('app');
    expect(event?.status).toBe('failure');
    expect(event?.output?.passed).toBe(false);
  });

  it('attributes rank_recipients to app', () => {
    let state: WorkflowState = {
      ...initialState,
      confirmations: {
        prepTimeLogged: true,
        refrigerationMaintained: true,
        packagingIntact: true,
        notPreviouslyServed: true,
        allergensReviewed: true,
        quantityVerified: true,
        deadlineConfirmed: true,
      },
    };
    state = workflowReducer(state, { type: 'START_MATCHING' });
    const event = getTraceEvent(state.agentTrace, 'rank_recipients');
    expect(event?.actor).toBe('app');
  });

  it('attributes create_offer to convex when Convex is available', () => {
    const state = workflowReducer(initialState, { type: 'CONVEX_OFFER_CREATED', token: 'token-123' });
    const event = getTraceEvent(state.agentTrace, 'create_offer');
    expect(event?.actor).toBe('convex');
    expect(event?.status).toBe('success');
  });

  it('attributes create_offer to fallback via PUSH_TRACE_EVENT', () => {
    const state = workflowReducer(initialState, {
      type: 'PUSH_TRACE_EVENT',
      event: {
        step: 'create_offer',
        actor: 'fallback',
        status: 'success',
        label: 'Create offer (demo)',
      },
    });
    const event = getTraceEvent(state.agentTrace, 'create_offer');
    expect(event?.actor).toBe('fallback');
    expect(event?.status).toBe('success');
  });

  it('orders trace events as analyze_food -> check_safety -> rank_recipients', () => {
    let state = workflowReducer(initialState, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, { type: 'ANALYSIS_SUCCESS', result: makeGemmaResult() });
    state = {
      ...state,
      confirmations: {
        prepTimeLogged: true,
        refrigerationMaintained: true,
        packagingIntact: true,
        notPreviouslyServed: true,
        allergensReviewed: true,
        quantityVerified: true,
        deadlineConfirmed: true,
      },
    };
    state = workflowReducer(state, { type: 'START_MATCHING' });
    const steps = state.agentTrace.events.map((e: { step: string }) => e.step);
    expect(steps).toEqual(['analyze_food', 'check_safety', 'rank_recipients']);
  });

  it('never attributes a non-analyze step to gemma', () => {
    let state: WorkflowState = {
      ...initialState,
      confirmations: {
        prepTimeLogged: true,
        refrigerationMaintained: true,
        packagingIntact: true,
        notPreviouslyServed: true,
        allergensReviewed: true,
        quantityVerified: true,
        deadlineConfirmed: true,
      },
    };
    state = workflowReducer(state, { type: 'START_ANALYSIS' });
    state = workflowReducer(state, { type: 'ANALYSIS_SUCCESS', result: makeGemmaResult() });
    state = workflowReducer(state, { type: 'START_MATCHING' });
    state = workflowReducer(state, { type: 'CONVEX_OFFER_CREATED', token: 'token-123' });

    const nonAnalyzeEvents = state.agentTrace.events.filter((e) => e.step !== 'analyze_food');
    expect(nonAnalyzeEvents.length).toBeGreaterThan(0);
    expect(nonAnalyzeEvents.every((e) => e.actor !== 'gemma')).toBe(true);
  });
});
