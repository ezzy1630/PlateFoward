import type { Analysis } from "./schema";

export const sampleAnalysis: Analysis = {
  foodItems: [
    { name: "Turkey Sandwich", category: "sandwich", estimatedQuantity: 18, confidence: 0.94 },
    { name: "Vegetarian Sandwich", category: "sandwich", estimatedQuantity: 12, confidence: 0.91 },
  ],
  temperatureState: "refrigerated",
  packagingState: "individually wrapped",
  pickupRequired: true,
  availableUntil: "2026-07-26T18:30:00.000Z",
  allergens: ["gluten", "dairy", "eggs"],
  missingInformation: ["preparation date", "donor organization"],
  conciseExplanation:
    "About thirty individually wrapped turkey and vegetarian sandwiches. All items appear freshly prepared and properly sealed. Refrigeration required. Pickup needed by 6:30 PM.",
};
