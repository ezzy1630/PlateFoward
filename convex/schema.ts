import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  donations: defineTable({
    publicId: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("reviewing"),
      v.literal("matching"),
      v.literal("offered"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("rerouted"),
      v.literal("expired"),
    ),
    foodType: v.string(),
    quantity: v.number(),
    unit: v.string(),
    pickupBy: v.string(),
    location: v.string(),
    notes: v.optional(v.string()),
    recipientSnapshots: v.array(
      v.object({
        recipientId: v.id("recipients"),
        name: v.string(),
        organization: v.string(),
        rank: v.number(),
      }),
    ),
    currentOfferIndex: v.number(),
    demoFallback: v.boolean(),
    confirmedFields: v.object({
      foodType: v.string(),
      quantity: v.number(),
      unit: v.string(),
      pickupBy: v.string(),
      location: v.string(),
      notes: v.optional(v.string()),
    }),
    demoOnly: v.boolean(),
  })
    .index("by_publicId", ["publicId"])
    .index("by_status", ["status"]),

  recipients: defineTable({
    name: v.string(),
    organization: v.string(),
    address: v.string(),
    capacity: v.number(),
    dietaryFocus: v.string(),
    hours: v.string(),
    rating: v.number(),
    waitTime: v.string(),
    contactName: v.string(),
    contactRole: v.string(),
    phone: v.string(),
    email: v.string(),
    notes: v.string(),
    verified: v.boolean(),
    demoOnly: v.boolean(),
  }),

  offers: defineTable({
    token: v.string(),
    donationId: v.id("donations"),
    recipientId: v.id("recipients"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired"),
    ),
    expiresAt: v.number(),
    responseAt: v.optional(v.number()),
    demoOnly: v.boolean(),
  })
    .index("by_token", ["token"])
    .index("by_donation", ["donationId"])
    .index("by_status", ["status"]),

  events: defineTable({
    donationId: v.id("donations"),
    type: v.string(),
    data: v.optional(v.any()),
    demoOnly: v.boolean(),
  })
    .index("by_donation", ["donationId"])
    .index("by_type", ["type"]),
});
