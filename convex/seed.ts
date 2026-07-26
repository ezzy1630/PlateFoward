import { v } from "convex/values";
import { mutation } from "./_generated/server";

const DEMO_RECIPIENTS = [
  {
    name: "Second Harvest Food Bank Santa Cruz County",
    organization: "Second Harvest Food Bank",
    address: "800 Ohlone Parkway, Watsonville, CA 95076",
    capacity: 10,
    dietaryFocus: "General / all categories — demo assumption",
    hours: "Daily 8am–3pm — demo assumption",
    rating: 5,
    sourceUrl: "https://thefoodbank.org/",
  },
  {
    name: "Grey Bears",
    organization: "Grey Bears",
    address: "2710 Chanticleer Avenue, Santa Cruz, CA 95062",
    capacity: 8,
    dietaryFocus: "General / all categories — demo assumption",
    hours: "Daily 7am–2pm — demo assumption",
    rating: 4,
    sourceUrl: "https://greybears.org/",
  },
  {
    name: "St. Francis Soup Kitchen",
    organization: "St. Francis Soup Kitchen",
    address: "205 Mora Street, Santa Cruz, CA 95060",
    capacity: 3,
    dietaryFocus: "Prepared meals / general — demo assumption",
    hours: "Daily 12pm–1pm — demo assumption",
    rating: 3,
    sourceUrl: "https://stfrancissoupkitchen.org/",
  },
  {
    name: "Pajaro Valley Loaves and Fishes",
    organization: "Pajaro Valley Loaves and Fishes",
    address: "150 2nd Street, Watsonville, CA 95076",
    capacity: 5,
    dietaryFocus: "Groceries / shelf-stable — demo assumption",
    hours: "Daily 9am–3pm — demo assumption",
    rating: 2,
    sourceUrl: "https://www.pvloavesandfishes.org/",
  },
  {
    name: "Valley Churches United Missions",
    organization: "Valley Churches United Missions",
    address: "9400 Highway 9, Ben Lomond, CA 95005",
    capacity: 5,
    dietaryFocus: "Produce / groceries — demo assumption",
    hours: "Tue–Thu 9–11:45am, Sat 10am–12pm — demo assumption",
    rating: 1,
    sourceUrl: "https://vcum.org/",
  },
] as const;

function conflictsWithDemoRecipient(
  existing: { name: string; organization: string; demoOnly: boolean },
): boolean {
  const expected = DEMO_RECIPIENTS.find(({ name }) => name === existing.name);
  return !expected || expected.organization !== existing.organization || !existing.demoOnly;
}

export const seedDemoRecipients = mutation({
  args: {},
  returns: v.object({
    seeded: v.boolean(),
    count: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const existing = await ctx.db.query("recipients").collect();
    const conflicting = existing.filter(conflictsWithDemoRecipient);

    if (conflicting.length > 0) {
      throw new Error(
        `Seed aborted: ${conflicting.length} conflicting recipient record(s) already exist.`,
      );
    }

    const existingNames = new Set(existing.map(({ name }) => name));
    const missing = DEMO_RECIPIENTS.filter(({ name }) => !existingNames.has(name));

    for (const recipient of missing) {
      await ctx.db.insert("recipients", {
        name: recipient.name,
        organization: recipient.organization,
        address: recipient.address,
        capacity: recipient.capacity,
        dietaryFocus: recipient.dietaryFocus,
        hours: recipient.hours,
        rating: recipient.rating,
        waitTime: "Demo assumption — verify with organization",
        contactName: "Demo placeholder — verify with organization",
        contactRole: "Demo placeholder — verify with organization",
        phone: "Not provided — use official source",
        email: "Not provided — use official source",
        notes: `All operational fields are demo assumptions. Demo dispatch rank: ${recipient.rating}. Verify acceptance, hours, capacity, and contact details with the organization. Official source: ${recipient.sourceUrl}`,
        verified: true,
        demoOnly: true,
      });
    }

    if (missing.length === 0) {
      return {
        seeded: false,
        count: 0,
        message: "All five PlateFoward demo recipients are already present.",
      };
    }

    return { seeded: true, count: missing.length };
  },
});
