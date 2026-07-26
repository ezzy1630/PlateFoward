import { describe, it, expect } from 'vitest';
import {
  canTransition,
  transitionOrThrow,
  getAllowedTransitions,
  isTerminal,
} from '@/lib/domain/lifecycle';
import type { DonationStatus, ConfirmedDonation } from '@/lib/domain/types';

function makeDonation(status: DonationStatus): ConfirmedDonation {
  return {
    id: 'don-001',
    donorId: 'donor-1',
    recipientId: 'recip-1',
    foodCategory: 'cold_prepared_food',
    quantity: 10,
    packagingState: 'sealed',
    temperatureState: 'refrigerated',
    safetyInfo: { temperatureLogged: true, packagingIntact: true, handlerCertified: true },
    pickupBy: '2026-07-28T16:00:00',
    status,
    confirmedAt: '2026-07-28T10:00:00',
    events: [],
  };
}

describe('canTransition', () => {
  const cases: [DonationStatus, DonationStatus, boolean][] = [
    ['draft', 'pending_match', true],
    ['draft', 'cancelled', true],
    ['draft', 'matched', false],
    ['draft', 'confirmed', false],
    ['draft', 'picked_up', false],
    ['draft', 'delivered', false],
    ['draft', 'declined', false],
    ['draft', 'expired', false],
    ['draft', 'draft', false],
    ['pending_match', 'matched', true],
    ['pending_match', 'expired', true],
    ['pending_match', 'cancelled', true],
    ['pending_match', 'confirmed', false],
    ['pending_match', 'draft', false],
    ['matched', 'confirmed', true],
    ['matched', 'declined', true],
    ['matched', 'expired', true],
    ['matched', 'cancelled', true],
    ['matched', 'picked_up', false],
    ['matched', 'draft', false],
    ['confirmed', 'picked_up', true],
    ['confirmed', 'cancelled', true],
    ['confirmed', 'delivered', false],
    ['confirmed', 'matched', false],
    ['picked_up', 'delivered', true],
    ['picked_up', 'confirmed', false],
    ['picked_up', 'cancelled', false],
    ['delivered', 'delivered', false],
    ['delivered', 'cancelled', false],
    ['declined', 'pending_match', false],
    ['declined', 'confirmed', false],
    ['expired', 'pending_match', false],
    ['expired', 'confirmed', false],
    ['cancelled', 'draft', false],
    ['cancelled', 'confirmed', false],
  ];

  for (const [current, next, expected] of cases) {
    it(`${current} -> ${next} = ${expected}`, () => {
      expect(canTransition(current, next)).toBe(expected);
    });
  }
});

describe('transitionOrThrow', () => {
  it('returns a new donation with updated status and appended event', () => {
    const donation = makeDonation('draft');
    const next = transitionOrThrow(donation, 'pending_match', { reason: 'auto-match' });

    expect(next.status).toBe('pending_match');
    expect(next.events).toHaveLength(1);
    expect(next.events[0].type).toBe('pending_match');
    expect(next.events[0].data).toEqual({ reason: 'auto-match' });
    expect(next.id).toBe(donation.id);
  });

  it('does not mutate the original donation', () => {
    const donation = makeDonation('draft');
    const originalStatus = donation.status;
    const originalEventsLen = donation.events.length;

    transitionOrThrow(donation, 'pending_match');

    expect(donation.status).toBe(originalStatus);
    expect(donation.events).toHaveLength(originalEventsLen);
  });

  it('throws on illegal transition', () => {
    const donation = makeDonation('draft');

    expect(() => transitionOrThrow(donation, 'delivered')).toThrow('Illegal transition');
  });

  it('throws on transition to same status', () => {
    const donation = makeDonation('confirmed');

    expect(() => transitionOrThrow(donation, 'confirmed')).toThrow('Illegal transition');
  });

  it('throws from a terminal state', () => {
    const donation = makeDonation('delivered');

    expect(() => transitionOrThrow(donation, 'cancelled')).toThrow('Illegal transition');
  });
});

describe('getAllowedTransitions', () => {
  it('returns correct transitions from draft', () => {
    expect(getAllowedTransitions('draft')).toEqual(['pending_match', 'cancelled']);
  });

  it('returns correct transitions from confirmed', () => {
    expect(getAllowedTransitions('confirmed')).toEqual(['picked_up', 'cancelled']);
  });

  it('returns empty array from terminal states', () => {
    for (const s of ['delivered', 'declined', 'expired', 'cancelled'] as DonationStatus[]) {
      expect(getAllowedTransitions(s)).toEqual([]);
    }
  });
});

describe('isTerminal', () => {
  it('returns false for non-terminal states', () => {
    for (const s of ['draft', 'pending_match', 'matched', 'confirmed', 'picked_up'] as DonationStatus[]) {
      expect(isTerminal(s)).toBe(false);
    }
  });

  it('returns true for terminal states', () => {
    for (const s of ['delivered', 'declined', 'expired', 'cancelled'] as DonationStatus[]) {
      expect(isTerminal(s)).toBe(true);
    }
  });
});
