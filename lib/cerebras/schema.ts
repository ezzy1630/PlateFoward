import { z } from "zod";

export const FoodItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  estimatedQuantity: z.number(),
  confidence: z.number().min(0).max(1),
});

export const AnalysisSchema = z.object({
  foodItems: z.array(FoodItemSchema),
  temperatureState: z.string(),
  packagingState: z.string(),
  pickupRequired: z.boolean(),
  availableUntil: z.string(),
  allergens: z.array(z.string()),
  missingInformation: z.array(z.string()),
  conciseExplanation: z.string(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type FoodItem = z.infer<typeof FoodItemSchema>;
