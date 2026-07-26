/**
 * Stable, documented pickup summary schema.
 *
 * This object is generated locally from validated application data and is
 * intended for the driver-facing collection summary. It intentionally omits
 * secrets, bearer tokens, and private contact information.
 */

export interface PickupSummaryJson {
  /** Public tracking identifier for the donation. */
  trackingId: string;
  /** Donation identifier. In demo mode this is the local donation id. */
  donationId: string;
  /** Recipient selected for pickup. */
  recipient: {
    name: string;
    address: string;
  };
  /** Food items and quantities. */
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  /** Food category for this donation. */
  foodCategory: string;
  /** Temperature requirement. */
  temperature: string;
  /** Packaging requirement. */
  packaging: string;
  /** Known or suspected allergens. */
  allergens: string[];
  /** ISO-8601 pickup deadline. */
  pickupDeadline: string;
  /** Donor pickup instructions or notes. */
  donorPickupInstructions: string;
  /** Current offer status. */
  offerStatus: string;
  /** Whether this summary was generated in demo mode. */
  demoOnly: boolean;
  /** Public recipient offer link when available. */
  offerUrl?: string;
  /** ISO-8601 timestamp when the summary was generated. */
  generatedAt: string;
}

export interface PickupSummaryInput {
  publicId: string | null;
  donationId: string | null;
  recipientName: string;
  recipientAddress: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  foodCategory: string;
  temperature: string;
  packaging: string;
  allergens: string[];
  pickupDeadline: string;
  donorPickupInstructions: string;
  offerStatus: string;
  demoOnly: boolean;
  offerUrl?: string;
}
