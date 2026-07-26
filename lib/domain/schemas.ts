import { z } from 'zod';

export const FoodCategorySchema = z.enum([
  'cold_prepared_food',
  'baked_goods',
  'produce',
  'refrigerated_grocery',
  'frozen_grocery',
  'shelf_stable',
]);

export const TemperatureStateSchema = z.enum([
  'refrigerated',
  'frozen',
  'ambient',
  'hot_holding',
]);

export const PackagingStateSchema = z.enum([
  'sealed',
  'open',
  'bulk',
  'individual',
]);

export const DonationStatusSchema = z.enum([
  'draft',
  'pending_match',
  'matched',
  'confirmed',
  'picked_up',
  'delivered',
  'declined',
  'expired',
  'cancelled',
]);

export const SafetyInfoSchema = z.object({
  temperatureLogged: z.boolean(),
  packagingIntact: z.boolean(),
  handlerCertified: z.boolean(),
});

export const OperatingHoursSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  open: z.string(),
  close: z.string(),
});

export const ServiceAreaSchema = z.object({
  zipCodes: z.array(z.string()),
});

export const RecipientSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  acceptedCategories: z.array(FoodCategorySchema),
  operatingHours: z.array(OperatingHoursSchema),
  serviceArea: ServiceAreaSchema.nullable(),
  maxDailyCapacity: z.number().int().min(0),
  capacityNotes: z.string(),
  sourceUrl: z.string(),
  verified: z.boolean(),
  demoOnly: z.boolean(),
});

export const DonationDraftSchema = z.object({
  id: z.string(),
  donorName: z.string(),
  donorZipCode: z.string(),
  foodCategory: FoodCategorySchema,
  quantity: z.number().positive(),
  packagingState: PackagingStateSchema,
  temperatureState: TemperatureStateSchema,
  safetyInfo: SafetyInfoSchema,
  pickupBy: z.string(),
  donorNotes: z.string().optional(),
  createdAt: z.string(),
});

export const DonationEventSchema = z.object({
  type: DonationStatusSchema,
  timestamp: z.string(),
  data: z.record(z.unknown()).optional(),
});

export const ConfirmedDonationSchema = z.object({
  id: z.string(),
  donorId: z.string(),
  recipientId: z.string(),
  foodCategory: FoodCategorySchema,
  quantity: z.number().positive(),
  packagingState: PackagingStateSchema,
  temperatureState: TemperatureStateSchema,
  safetyInfo: SafetyInfoSchema,
  pickupBy: z.string(),
  donorNotes: z.string().optional(),
  status: DonationStatusSchema,
  confirmedAt: z.string(),
  events: z.array(DonationEventSchema),
});

export const MatchFailureSchema = z.enum([
  'safety_incomplete',
  'category_mismatch',
  'pickup_unavailable',
  'service_area_mismatch',
  'closes_before_arrival',
  'eta_after_deadline',
  'insufficient_demo_capacity',
]);

export const MatchResultSchema = z.object({
  donationId: z.string(),
  recipient: RecipientSchema,
  score: z.number(),
  failures: z.array(MatchFailureSchema),
  compatible: z.boolean(),
});
