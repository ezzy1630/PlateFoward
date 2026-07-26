# PlateFoward

Move good food forward. Demo-only food rescue coordination for Santa Cruz County.

## Quick Start

```bash
# Install
npm install

# Environment
cp .env.example .env.local
# Fill in CEREBRAS_API_KEY, then link Convex with `npx convex dev`.

# Dev
npm run dev
```

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `CEREBRAS_API_KEY` | Yes for live AI | Cerebras-hosted Gemma 4 vision extraction |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name |

## Convex Setup

```bash
# Deploy backend
npx convex deploy

# Seed five Santa Cruz demo recipients
npx convex run seed:seedDemoRecipients
```

Seed inserts five demo-only Santa Cruz County recipients:
- Second Harvest Food Bank Santa Cruz County (Watsonville)
- Grey Bears (Santa Cruz)
- St. Francis Soup Kitchen (Santa Cruz)
- Pajaro Valley Loaves and Fishes (Watsonville)
- Valley Churches United Missions (Ben Lomond)

All marked `demoOnly: true`. No real contacts or operational data.

## How it works

- **Vision extraction:** `/api/analyze` sends the donor photo and optional sample voice transcript to Cerebras-hosted `gemma-4-31b`, requests native JSON schema output, validates the result, and retries once with a repair prompt when needed.
- **Explicit fallback:** If live inference is unavailable, the UI offers a clearly labeled sample-data action. It never silently substitutes fixture output.
- **Safety gate:** Seven donor confirmations must be checked before matching begins.
- **Deterministic matching:** The client matcher evaluates category, service area, demo hours/capacity, deadline, ETA, and safety completeness against the five Santa Cruz demo recipients.
- **Realtime dispatch:** Convex persists the donation, creates a bearer-token offer, exposes donor status, and reroutes to the next demo recipient after a decline.

Demo dispatch priority is Second Harvest, Grey Bears, St. Francis, Pajaro Valley, then VCUM. This is prototype ranking—not a claim of real availability or preference.

## Demo Fallback

All seed data is demo-only:
- 5 Santa Cruz recipients (`demoOnly: true`)
- Sample: ~30 turkey and vegetarian sandwiches, refrigerated, pickup by 6:30 PM
- Sample audio: `public/demo/sample-donation.m4a`
- All wait times and capacities labeled demo-only in notes and UI
- No real nonprofit participation, food safety claims, or regulatory compliance implied

## PWA

- Installable via manifest (`/manifest.webmanifest`)
- Service worker (`/sw.js`) caches static assets
- Auto-registers via `PWARegistration` component in root layout
- Scope: `/`, orientation: `portrait-primary`, maskable icon declared

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest run |
| `npm run test:watch` | Vitest watch |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: Convex (realtime DB, serverless functions, crons)
- **Validation**: Zod
- **Testing**: Vitest, jsdom, React Testing Library

## License

MIT
