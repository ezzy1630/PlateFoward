import { v } from "convex/values";
import { query } from "./_generated/server";

export const getEvents = query({
  args: { donationId: v.id("donations") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_donation", (q) => q.eq("donationId", args.donationId))
      .collect();

    return events
      .sort((a, b) => b._creationTime - a._creationTime)
      .map((e) => ({
        type: e.type,
        data: e.data,
        demoOnly: e.demoOnly,
        _creationTime: e._creationTime,
      }));
  },
});
