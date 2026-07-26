import { describe, it, expect } from 'vitest';
import { RECIPIENT_PRIORITY } from '@/convex/donations';

const EXPECTED_ORDER = [
  'Second Harvest Food Bank Santa Cruz County',
  'Grey Bears',
  'St. Francis Soup Kitchen',
  'Pajaro Valley Loaves and Fishes',
  'Valley Churches United Missions',
];

describe('RECIPIENT_PRIORITY', () => {
  for (let i = 0; i < EXPECTED_ORDER.length; i++) {
    const name = EXPECTED_ORDER[i];
    it(`${name} has priority ${i + 1}`, () => {
      expect(RECIPIENT_PRIORITY[name]).toBe(i + 1);
    });
  }
});

describe('donation matcher order for 95060 cold-prepared food', () => {
  it('sorts verified recipients by priority: Second Harvest > Grey Bears > St. Francis > Pajaro Valley > VCUM', () => {
    const recipients = EXPECTED_ORDER.map((name, i) => ({
      name,
      organization: name,
      verified: true,
      rating: 5 - i,
      _id: `recip-${i + 1}` as const,
    }));

    const sorted = [...recipients]
      .sort((a, b) => {
        const pa = RECIPIENT_PRIORITY[a.name] ?? 99;
        const pb = RECIPIENT_PRIORITY[b.name] ?? 99;
        return pa - pb;
      })
      .map((r) => r.name);

    expect(sorted).toEqual(EXPECTED_ORDER);
  });

  it('is deterministic regardless of insertion order', () => {
    const shuffled = [...EXPECTED_ORDER].reverse();
    const recipients = shuffled.map((name, i) => ({
      name,
      organization: name,
      verified: true,
      rating: i + 1,
      _id: `recip-${i + 1}` as const,
    }));

    const sorted = [...recipients]
      .sort((a, b) => {
        const pa = RECIPIENT_PRIORITY[a.name] ?? 99;
        const pb = RECIPIENT_PRIORITY[b.name] ?? 99;
        return pa - pb;
      })
      .map((r) => r.name);

    expect(sorted).toEqual(EXPECTED_ORDER);
  });
});