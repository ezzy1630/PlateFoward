import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const RECIPIENT_PRIORITY: Record<string, number> = {
  "Second Harvest Food Bank Santa Cruz County": 1,
  "Grey Bears": 2,
  "St. Francis Soup Kitchen": 3,
  "Pajaro Valley Loaves and Fishes": 4,
  "Valley Churches United Missions": 5,
};

function generatePublicId(): string {
  return crypto.randomUUID();
}

export const createDonation = mutation({
  args: {
    foodType: v.string(),
    quantity: v.number(),
    unit: v.string(),
    pickupBy: v.string(),
    location: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    donationId: v.id("donations"),
    publicId: v.string(),
  }),
  handler: async (ctx, args) => {
    const publicId = generatePublicId();
    const donationId = await ctx.db.insert("donations", {
      publicId,
      status: "draft",
      foodType: args.foodType,
      quantity: args.quantity,
      unit: args.unit,
      pickupBy: args.pickupBy,
      location: args.location,
      notes: args.notes,
      recipientSnapshots: [],
      currentOfferIndex: 0,
      demoFallback: false,
      confirmedFields: {
        foodType: args.foodType,
        quantity: args.quantity,
        unit: args.unit,
        pickupBy: args.pickupBy,
        location: args.location,
        notes: args.notes,
      },
      demoOnly: true,
    });

    await ctx.db.insert("events", {
      donationId,
      type: "donation.created",
      data: { publicId, foodType: args.foodType, quantity: args.quantity },
      demoOnly: true,
    });

    return { donationId, publicId };
  },
});

export const confirmDonation = mutation({
  args: {
    donationId: v.id("donations"),
    confirmedFields: v.object({
      foodType: v.string(),
      quantity: v.number(),
      unit: v.string(),
      pickupBy: v.string(),
      location: v.string(),
      notes: v.optional(v.string()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "draft") throw new Error("Donation is not in draft status");

    const recipients = await ctx.db.query("recipients").collect();
    const snapshots = recipients
      .filter((r) => r.verified)
      .sort((a, b) => {
        const pa = RECIPIENT_PRIORITY[a.name] ?? 99;
        const pb = RECIPIENT_PRIORITY[b.name] ?? 99;
        return pa - pb;
      })
      .map((r, i) => ({
        recipientId: r._id,
        name: r.name,
        organization: r.organization,
        rank: i + 1,
      }));

    await ctx.db.patch(args.donationId, {
      status: "matching",
      foodType: args.confirmedFields.foodType,
      quantity: args.confirmedFields.quantity,
      unit: args.confirmedFields.unit,
      pickupBy: args.confirmedFields.pickupBy,
      location: args.confirmedFields.location,
      notes: args.confirmedFields.notes,
      confirmedFields: args.confirmedFields,
      recipientSnapshots: snapshots,
      currentOfferIndex: 0,
    });

    await ctx.db.insert("events", {
      donationId: args.donationId,
      type: "donation.confirmed",
      data: { confirmedFields: args.confirmedFields, recipientCount: snapshots.length },
      demoOnly: true,
    });
  },
});

export const getDonation = query({
  args: { donationId: v.id("donations") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("donations"),
      publicId: v.string(),
      status: v.string(),
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
        })
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
      _creationTime: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) return null;
    return {
      _id: donation._id,
      publicId: donation.publicId,
      status: donation.status,
      foodType: donation.foodType,
      quantity: donation.quantity,
      unit: donation.unit,
      pickupBy: donation.pickupBy,
      location: donation.location,
      notes: donation.notes,
      recipientSnapshots: donation.recipientSnapshots,
      currentOfferIndex: donation.currentOfferIndex,
      demoFallback: donation.demoFallback,
      confirmedFields: donation.confirmedFields,
      demoOnly: donation.demoOnly,
      _creationTime: donation._creationTime,
    };
  },
});

export const getDonationByPublicId = query({
  args: { publicId: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      publicId: v.string(),
      status: v.string(),
      foodType: v.string(),
      quantity: v.number(),
      unit: v.string(),
      pickupBy: v.string(),
      location: v.string(),
      notes: v.optional(v.string()),
      recipientSnapshots: v.array(
        v.object({
          name: v.string(),
          organization: v.string(),
          rank: v.number(),
        })
      ),
      demoOnly: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const donation = await ctx.db
      .query("donations")
      .withIndex("by_publicId", (q) => q.eq("publicId", args.publicId))
      .unique();
    if (!donation) return null;
    return {
      publicId: donation.publicId,
      status: donation.status,
      foodType: donation.foodType,
      quantity: donation.quantity,
      unit: donation.unit,
      pickupBy: donation.pickupBy,
      location: donation.location,
      notes: donation.notes,
      recipientSnapshots: donation.recipientSnapshots.map((s) => ({
        name: s.name,
        organization: s.organization,
        rank: s.rank,
      })),
      demoOnly: donation.demoOnly,
    };
  },
});
