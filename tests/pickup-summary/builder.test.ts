import { describe, it, expect } from 'vitest';
import {
  buildPickupJson,
  buildPickupFilename,
  buildPickupJsonString,
} from '@/lib/pickup-summary/builder';
import type { PickupSummaryInput } from '@/lib/pickup-summary/types';

const baseInput: PickupSummaryInput = {
  publicId: 'track-123',
  donationId: 'don-abc',
  recipientName: 'Second Harvest Food Bank',
  recipientAddress: '800 Ohlone Parkway, Watsonville, CA 95076',
  items: [{ name: 'Turkey sandwiches', quantity: 30, unit: 'servings' }],
  foodCategory: 'cold_prepared_food',
  temperature: 'refrigerated',
  packaging: 'sealed',
  allergens: ['gluten', 'dairy'],
  pickupDeadline: '2026-07-28T18:30:00.000Z',
  donorPickupInstructions: 'Pick up at the loading dock.',
  offerStatus: 'offered',
  demoOnly: true,
  offerUrl: 'https://example.com/offer/token',
};

describe('buildPickupJson', () => {
  it('maps all input fields to the JSON schema', () => {
    const json = buildPickupJson(baseInput);
    expect(json.trackingId).toBe('track-123');
    expect(json.donationId).toBe('don-abc');
    expect(json.recipient.name).toBe('Second Harvest Food Bank');
    expect(json.recipient.address).toBe('800 Ohlone Parkway, Watsonville, CA 95076');
    expect(json.items).toHaveLength(1);
    expect(json.items[0]).toEqual({ name: 'Turkey sandwiches', quantity: 30, unit: 'servings' });
    expect(json.foodCategory).toBe('cold_prepared_food');
    expect(json.temperature).toBe('refrigerated');
    expect(json.packaging).toBe('sealed');
    expect(json.allergens).toEqual(['gluten', 'dairy']);
    expect(json.pickupDeadline).toBe('2026-07-28T18:30:00.000Z');
    expect(json.donorPickupInstructions).toBe('Pick up at the loading dock.');
    expect(json.offerStatus).toBe('offered');
    expect(json.demoOnly).toBe(true);
    expect(json.offerUrl).toBe('https://example.com/offer/token');
    expect(json.generatedAt).toBeDefined();
  });

  it('omits secrets, tokens, and private contact data', () => {
    const json = buildPickupJson(baseInput);
    const stringified = JSON.stringify(json);
    expect(stringified).not.toContain('bearer');
    expect(stringified).not.toContain('password');
    expect(stringified).not.toContain('secret');
    expect(stringified).not.toContain('phone');
    expect(stringified).not.toContain('email');
    expect(stringified).not.toContain('apiKey');
  });

  it('falls back to donation id when public id is missing', () => {
    const json = buildPickupJson({ ...baseInput, publicId: null });
    expect(json.trackingId).toBe('don-abc');
  });

  it('falls back to demo when both ids are missing', () => {
    const json = buildPickupJson({
      ...baseInput,
      publicId: null,
      donationId: null,
    });
    expect(json.trackingId).toBe('demo');
    expect(json.donationId).toBe('demo');
  });

  it('defaults missing optional data gracefully', () => {
    const json = buildPickupJson({
      ...baseInput,
      offerUrl: undefined,
      allergens: [],
      donorPickupInstructions: '',
    });
    expect(json.offerUrl).toBeUndefined();
    expect(json.allergens).toEqual([]);
    expect(json.donorPickupInstructions).toBe('');
  });
});

describe('buildPickupFilename', () => {
  it('uses the public id in the filename', () => {
    expect(buildPickupFilename('track-123')).toBe('platefoward-pickup-track-123.json');
  });

  it('sanitizes unsafe characters', () => {
    expect(buildPickupFilename('track/123:bad')).toBe('platefoward-pickup-track_123_bad.json');
  });

  it('falls back to demo when id is null', () => {
    expect(buildPickupFilename(null)).toBe('platefoward-pickup-demo.json');
  });
});

describe('buildPickupJsonString', () => {
  it('produces a valid JSON string', () => {
    const json = buildPickupJson(baseInput);
    const str = buildPickupJsonString(json);
    expect(JSON.parse(str)).toEqual(json);
  });
});
