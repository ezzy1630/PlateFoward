import type { PickupSummaryInput, PickupSummaryJson } from "./types";

/**
 * Build a pickup summary JSON from validated application data.
 *
 * Omissions by design:
 * - No bearer tokens, secrets, or private contact data.
 * - No internal database ids unless a public tracking id is unavailable.
 * - No operational claims not supported by the application data.
 */
export function buildPickupJson(input: PickupSummaryInput): PickupSummaryJson {
  const trackingId = input.publicId ?? input.donationId ?? "demo";

  return {
    trackingId,
    donationId: input.donationId ?? trackingId,
    recipient: {
      name: input.recipientName,
      address: input.recipientAddress,
    },
    items: input.items,
    foodCategory: input.foodCategory,
    temperature: input.temperature,
    packaging: input.packaging,
    allergens: input.allergens,
    pickupDeadline: input.pickupDeadline,
    donorPickupInstructions: input.donorPickupInstructions,
    offerStatus: input.offerStatus,
    demoOnly: input.demoOnly,
    offerUrl: input.offerUrl,
    generatedAt: new Date().toISOString(),
  };
}

export function buildPickupFilename(trackingId: string | null): string {
  const safe = (trackingId ?? "demo").replace(/[^a-zA-Z0-9-_]/g, "_");
  return `platefoward-pickup-${safe}.json`;
}

export function buildPickupJsonString(json: PickupSummaryJson): string {
  return JSON.stringify(json, null, 2);
}

export function downloadJson(json: PickupSummaryJson, filename: string): void {
  const blob = new Blob([buildPickupJsonString(json)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
