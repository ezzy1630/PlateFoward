import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateToken } from "./lib/tokens";

const OFFER_TTL_MS = 30 * 60 * 1000;

export const createOffer = mutation({
  args: {
    donationId: v.id("donations"),
  },
  returns: v.object({
    token: v.string(),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const donation = await ctx.db.get(args.donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "matching") throw new Error("Donation is not in matching status");

    const snapshot = donation.recipientSnapshots[donation.currentOfferIndex];
    if (!snapshot) throw new Error("No recipients available");

    const token = generateToken();
    const expiresAt = Date.now() + OFFER_TTL_MS;

    await ctx.db.insert("offers", {
      token,
      donationId: args.donationId,
      recipientId: snapshot.recipientId,
      status: "pending",
      expiresAt,
      demoOnly: true,
    });

    await ctx.db.patch(args.donationId, { status: "offered" });

    await ctx.db.insert("events", {
      donationId: args.donationId,
      type: "offer.created",
      data: {
        recipientId: snapshot.recipientId,
        recipientName: snapshot.name,
        recipientOrganization: snapshot.organization,
        expiresAt,
      },
      demoOnly: true,
    });

    return { token, expiresAt };
  },
});

export const getOfferByToken = query({
  args: { token: v.string() },
  returns: v.union(
    v.null(),
    v.object({
      status: v.string(),
      expiresAt: v.number(),
      demoOnly: v.boolean(),
      donation: v.object({
        foodType: v.string(),
        quantity: v.number(),
        unit: v.string(),
        pickupBy: v.string(),
        location: v.string(),
        notes: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const offer = await ctx.db
      .query("offers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!offer) return null;

    const donation = await ctx.db.get(offer.donationId);
    if (!donation) return null;

    return {
      status: offer.status,
      expiresAt: offer.expiresAt,
      demoOnly: offer.demoOnly,
      donation: {
        foodType: donation.foodType,
        quantity: donation.quantity,
        unit: donation.unit,
        pickupBy: donation.pickupBy,
        location: donation.location,
        notes: donation.notes,
      },
    };
  },
});

export const respondToOffer = mutation({
  args: {
    token: v.string(),
    response: v.union(v.literal("accept"), v.literal("decline")),
  },
  returns: v.object({
    outcome: v.union(v.literal("accepted"), v.literal("declined")),
    nextToken: v.optional(v.string()),
    nextRecipient: v.optional(
      v.object({
        name: v.string(),
        organization: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const offer = await ctx.db
      .query("offers")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!offer) throw new Error("Offer not found");
    if (offer.status !== "pending") throw new Error("Offer has already been responded to");
    if (offer.expiresAt < Date.now()) throw new Error("Offer has expired");

    const donation = await ctx.db.get(offer.donationId);
    if (!donation) throw new Error("Donation not found");

    const now = Date.now();

    if (args.response === "accept") {
      await ctx.db.patch(offer._id, {
        status: "accepted",
        responseAt: now,
      });
      await ctx.db.patch(donation._id, { status: "accepted" });
      await ctx.db.insert("events", {
        donationId: donation._id,
        type: "offer.accepted",
        data: { recipientId: offer.recipientId, token: args.token },
        demoOnly: true,
      });
      return { outcome: "accepted" as const };
    }

    await ctx.db.patch(offer._id, {
      status: "declined",
      responseAt: now,
    });

    const nextIndex = donation.currentOfferIndex + 1;
    const nextSnapshot = donation.recipientSnapshots[nextIndex];

    let nextToken: string | undefined;

    if (nextSnapshot) {
      nextToken = generateToken();
      const expiresAt = now + OFFER_TTL_MS;
      await ctx.db.insert("offers", {
        token: nextToken,
        donationId: donation._id,
        recipientId: nextSnapshot.recipientId,
        status: "pending",
        expiresAt,
        demoOnly: true,
      });
    }

    await ctx.db.patch(donation._id, {
      status: nextSnapshot ? "rerouted" : "declined",
      currentOfferIndex: nextIndex,
    });

    await ctx.db.insert("events", {
      donationId: donation._id,
      type: "offer.declined",
      data: {
        recipientId: offer.recipientId,
        token: args.token,
        nextRecipientId: nextSnapshot?.recipientId,
        nextRecipientName: nextSnapshot?.name,
        nextRecipientOrganization: nextSnapshot?.organization,
      },
      demoOnly: true,
    });

    return {
      outcome: "declined" as const,
      nextToken,
      nextRecipient: nextSnapshot
        ? { name: nextSnapshot.name, organization: nextSnapshot.organization }
        : undefined,
    };
  },
});
