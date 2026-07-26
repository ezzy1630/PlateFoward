import type { DonationStatus, ConfirmedDonation, DonationEvent } from './types';

const TRANSITIONS: Record<DonationStatus, readonly DonationStatus[]> = {
  draft: ['pending_match', 'cancelled'],
  pending_match: ['matched', 'expired', 'cancelled'],
  matched: ['confirmed', 'declined', 'expired', 'cancelled'],
  confirmed: ['picked_up', 'cancelled'],
  picked_up: ['delivered'],
  delivered: [],
  declined: [],
  expired: [],
  cancelled: [],
};

export function canTransition(
  current: DonationStatus,
  next: DonationStatus
): boolean {
  return TRANSITIONS[current].includes(next);
}

export function transitionOrThrow(
  donation: ConfirmedDonation,
  to: DonationStatus,
  data?: Record<string, unknown>
): ConfirmedDonation {
  if (!canTransition(donation.status, to)) {
    throw new Error(
      `Illegal transition: ${donation.status} -> ${to}`
    );
  }

  const event: DonationEvent = {
    type: to,
    timestamp: new Date().toISOString(),
    data,
  };

  return {
    ...donation,
    status: to,
    events: [...donation.events, event],
  };
}

export function getAllowedTransitions(
  status: DonationStatus
): readonly DonationStatus[] {
  return TRANSITIONS[status];
}

export function isTerminal(status: DonationStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
