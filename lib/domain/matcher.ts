import type {
  DonationDraft,
  Recipient,
  MatchResult,
  MatchFailure,
  OperatingHours,
} from './types';

export interface MatchOptions {
  now: Date;
  etaMinutes: number;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getOperatingHoursForDay(
  hours: OperatingHours[],
  dayOfWeek: number
): OperatingHours | undefined {
  return hours.find(h => h.dayOfWeek === dayOfWeek);
}

function isSafetyComplete(donation: DonationDraft): boolean {
  return (
    donation.safetyInfo.temperatureLogged &&
    donation.safetyInfo.packagingIntact &&
    donation.safetyInfo.handlerCertified
  );
}

function checkCategoryMatch(
  donation: DonationDraft,
  recipient: Recipient
): boolean {
  return recipient.acceptedCategories.includes(donation.foodCategory);
}

function checkServiceArea(
  donation: DonationDraft,
  recipient: Recipient
): boolean {
  if (!recipient.serviceArea) return true;
  return recipient.serviceArea.zipCodes.includes(donation.donorZipCode);
}

function checkDemoCapacity(
  _donation: DonationDraft,
  recipient: Recipient
): boolean {
  if (!recipient.demoOnly) return true;
  return recipient.maxDailyCapacity > 0;
}

function computeScore(
  donation: DonationDraft,
  recipient: Recipient
): number {
  let score = 100;

  if (recipient.verified) score += 15;

  if (recipient.demoOnly && recipient.maxDailyCapacity < 10) score -= 20;

  const catIndex = recipient.acceptedCategories.indexOf(donation.foodCategory);
  if (catIndex === 0) score += 10;

  const hoursVariety = recipient.operatingHours.length;
  score += Math.min(hoursVariety * 2, 10);

  return score;
}

function evaluateMatch(
  donation: DonationDraft,
  recipient: Recipient,
  options: MatchOptions
): MatchResult {
  const failures: MatchFailure[] = [];

  if (!isSafetyComplete(donation)) {
    failures.push('safety_incomplete');
  }

  if (!checkCategoryMatch(donation, recipient)) {
    failures.push('category_mismatch');
  }

  if (!checkDemoCapacity(donation, recipient)) {
    failures.push('insufficient_demo_capacity');
  }

  if (!checkServiceArea(donation, recipient)) {
    failures.push('service_area_mismatch');
  }

  const dayOfWeek = options.now.getDay();
  const todayHours = getOperatingHoursForDay(recipient.operatingHours, dayOfWeek);

  if (!todayHours) {
    failures.push('pickup_unavailable');
  }

  const nowMinutes = options.now.getHours() * 60 + options.now.getMinutes();
  const etaMinutesTotal = nowMinutes + options.etaMinutes;

  if (todayHours) {
    const closeMinutes = toMinutes(todayHours.close);
    if (etaMinutesTotal > closeMinutes) {
      failures.push('closes_before_arrival');
    }
  }

  const etaDate = new Date(options.now.getTime() + options.etaMinutes * 60_000);
  const pickupByDate = new Date(donation.pickupBy);

  if (etaDate > pickupByDate) {
    failures.push('eta_after_deadline');
  }

  const compatible = failures.length === 0;
  const score = compatible ? computeScore(donation, recipient) : 0;

  return {
    donationId: donation.id,
    recipient,
    score,
    failures,
    compatible,
  };
}

function sortByScore(a: MatchResult, b: MatchResult): number {
  if (a.compatible !== b.compatible) return a.compatible ? -1 : 1;
  if (a.score !== b.score) return b.score - a.score;
  return a.recipient.id.localeCompare(b.recipient.id);
}

export function matchDonation(
  donation: DonationDraft,
  recipients: Recipient[],
  options: MatchOptions
): MatchResult[] {
  return recipients
    .map(recipient => evaluateMatch(donation, recipient, options))
    .sort(sortByScore);
}
