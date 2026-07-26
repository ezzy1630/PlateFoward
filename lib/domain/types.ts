export type FoodCategory =
  | 'cold_prepared_food'
  | 'baked_goods'
  | 'produce'
  | 'refrigerated_grocery'
  | 'frozen_grocery'
  | 'shelf_stable';

export type TemperatureState = 'refrigerated' | 'frozen' | 'ambient' | 'hot_holding';

export type PackagingState = 'sealed' | 'open' | 'bulk' | 'individual';

export type DonationStatus =
  | 'draft'
  | 'pending_match'
  | 'matched'
  | 'confirmed'
  | 'picked_up'
  | 'delivered'
  | 'declined'
  | 'expired'
  | 'cancelled';

export interface SafetyInfo {
  temperatureLogged: boolean;
  packagingIntact: boolean;
  handlerCertified: boolean;
}

export interface OperatingHours {
  dayOfWeek: number;
  open: string;
  close: string;
}

export interface ServiceArea {
  zipCodes: string[];
}

export interface Recipient {
  id: string;
  name: string;
  address: string;
  acceptedCategories: FoodCategory[];
  operatingHours: OperatingHours[];
  serviceArea: ServiceArea | null;
  maxDailyCapacity: number;
  capacityNotes: string;
  sourceUrl: string;
  verified: boolean;
  demoOnly: boolean;
}

export interface DonationDraft {
  id: string;
  donorName: string;
  donorZipCode: string;
  foodCategory: FoodCategory;
  quantity: number;
  packagingState: PackagingState;
  temperatureState: TemperatureState;
  safetyInfo: SafetyInfo;
  pickupBy: string;
  donorNotes?: string;
  createdAt: string;
}

export interface DonationEvent {
  type: DonationStatus;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface ConfirmedDonation {
  id: string;
  donorId: string;
  recipientId: string;
  foodCategory: FoodCategory;
  quantity: number;
  packagingState: PackagingState;
  temperatureState: TemperatureState;
  safetyInfo: SafetyInfo;
  pickupBy: string;
  donorNotes?: string;
  status: DonationStatus;
  confirmedAt: string;
  events: DonationEvent[];
}

export type MatchFailure =
  | 'safety_incomplete'
  | 'category_mismatch'
  | 'pickup_unavailable'
  | 'service_area_mismatch'
  | 'closes_before_arrival'
  | 'eta_after_deadline'
  | 'insufficient_demo_capacity';

export interface MatchResult {
  donationId: string;
  recipient: Recipient;
  score: number;
  failures: MatchFailure[];
  compatible: boolean;
}
