import { describe, it, expect } from 'vitest';
import { matchDonation } from '@/lib/domain/matcher';
import { SEED_RECIPIENTS } from '@/lib/demo/recipients';
import type { DonationDraft } from '@/lib/domain/types';

const TUESDAY_10AM = new Date('2026-07-28T10:00:00');
const ETA_30_MIN = 30;

const SAFE_DRAFT: DonationDraft = {
  id: 'don-001',
  donorName: 'Test Donor',
  donorZipCode: '95060',
  foodCategory: 'cold_prepared_food',
  quantity: 20,
  packagingState: 'sealed',
  temperatureState: 'refrigerated',
  safetyInfo: {
    temperatureLogged: true,
    packagingIntact: true,
    handlerCertified: true,
  },
  pickupBy: '2026-07-28T16:00:00',
  createdAt: '2026-07-28T09:00:00',
};

describe('matchDonation', () => {
  describe('sandwich scenario — full compatibility', () => {
    it('ranks compatible recipients by score descending', () => {
      const results = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const compatible = results.filter(r => r.compatible);
      expect(compatible.length).toBeGreaterThanOrEqual(1);

      for (let i = 1; i < compatible.length; i++) {
        expect(compatible[i].score).toBeLessThanOrEqual(compatible[i - 1].score);
      }
    });

    it('places compatible results before incompatible ones', () => {
      const results = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const firstIncompatible = results.findIndex(r => !r.compatible);
      const lastCompatible = results.map((r, i) => ({ r, i }))
        .filter(({ r }) => r.compatible)
        .pop()?.i ?? -1;

      if (firstIncompatible >= 0 && lastCompatible >= 0) {
        expect(firstIncompatible).toBeGreaterThan(lastCompatible);
      }
    });
  });

  describe('incompatible category', () => {
    it('fails with category_mismatch when recipient does not accept the category', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        foodCategory: 'frozen_grocery',
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const pvResult = results.find(r => r.recipient.id === 'pv-loaves-fishes');
      expect(pvResult).toBeDefined();
      expect(pvResult!.compatible).toBe(false);
      expect(pvResult!.failures).toContain('category_mismatch');
    });
  });

  describe('safety incomplete', () => {
    it('fails with safety_incomplete when temperature not logged', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        safetyInfo: { ...SAFE_DRAFT.safetyInfo, temperatureLogged: false },
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        expect(r.compatible).toBe(false);
        expect(r.failures).toContain('safety_incomplete');
      }
    });

    it('fails with safety_incomplete when packaging not intact', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        safetyInfo: { ...SAFE_DRAFT.safetyInfo, packagingIntact: false },
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        expect(r.failures).toContain('safety_incomplete');
      }
    });

    it('fails with safety_incomplete when handler not certified', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        safetyInfo: { ...SAFE_DRAFT.safetyInfo, handlerCertified: false },
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        expect(r.failures).toContain('safety_incomplete');
      }
    });
  });

  describe('closed recipient', () => {
    it('fails with pickup_unavailable when recipient has no operating hours on that day', () => {
      const sunday = new Date('2026-08-02T10:00:00');

      const results = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: sunday,
        etaMinutes: ETA_30_MIN,
      });

      const vcumResult = results.find(r => r.recipient.id === 'vcum');
      expect(vcumResult).toBeDefined();
      expect(vcumResult!.compatible).toBe(false);
      expect(vcumResult!.failures).toContain('pickup_unavailable');
    });
  });

  describe('service area mismatch', () => {
    it('fails with service_area_mismatch when donor zip is outside recipient service area', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        donorZipCode: '99999',
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        if (r.recipient.serviceArea) {
          expect(r.failures).toContain('service_area_mismatch');
        }
      }
    });
  });

  describe('closes before arrival', () => {
    it('fails with closes_before_arrival when recipient closes before ETA', () => {
      const lateAfternoon = new Date('2026-07-28T14:45:00');

      const vcumResult = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: lateAfternoon,
        etaMinutes: ETA_30_MIN,
      }).find(r => r.recipient.id === 'vcum');

      expect(vcumResult).toBeDefined();
      expect(vcumResult!.failures).toContain('closes_before_arrival');
    });
  });

  describe('ETA after deadline', () => {
    it('fails with eta_after_deadline when arrival exceeds pickupBy', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        pickupBy: '2026-07-28T10:15:00',
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        expect(r.failures).toContain('eta_after_deadline');
      }
    });
  });

  describe('decline rerank input', () => {
    it('reproduces same ranking deterministically for identical inputs', () => {
      const results1 = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const results2 = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (let i = 0; i < results1.length; i++) {
        expect(results1[i].recipient.id).toBe(results2[i].recipient.id);
        expect(results1[i].score).toBe(results2[i].score);
      }
    });

    it('reranks when a previously top recipient is excluded', () => {
      const allResults = matchDonation(SAFE_DRAFT, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const topRecipientId = allResults.find(r => r.compatible)?.recipient.id;
      expect(topRecipientId).toBeDefined();

      const filteredRecipients = SEED_RECIPIENTS.filter(r => r.id !== topRecipientId);
      const reranked = matchDonation(SAFE_DRAFT, filteredRecipients, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      const newTop = reranked.find(r => r.compatible);
      expect(newTop).toBeDefined();
      expect(newTop!.recipient.id).not.toBe(topRecipientId);
    });
  });

  describe('expiry', () => {
    it('fails all with eta_after_deadline when pickupBy has already passed', () => {
      const draft: DonationDraft = {
        ...SAFE_DRAFT,
        pickupBy: '2026-07-27T10:00:00',
      };

      const results = matchDonation(draft, SEED_RECIPIENTS, {
        now: TUESDAY_10AM,
        etaMinutes: ETA_30_MIN,
      });

      for (const r of results) {
        expect(r.failures).toContain('eta_after_deadline');
      }
    });
  });
});
