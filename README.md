# Before You Go

AI-powered restaurant review insights for faster dining decisions.

Before You Go lets users search restaurants via Google Places, collect review data, and generate concise AI summaries (basic and detailed) before visiting a place.

## Features

- Google Maps / Places based restaurant discovery
- Basic summary generation from collected reviews
- Detailed AI analysis with keyword and dish extraction
- User authentication with Supabase
- Bookmark and personal review management (`/my-page`)
- Pricing page and upgrade flow
- Server-side usage limit by user ID (default: 3 analysis requests)

## Tech Stack

- Next.js (Pages Router) + React + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Auth + DB)
- Google Places API + Gemini API
- Stripe (optional billing integration)

## Pages

- `/` Home
- `/search` Restaurant search + analysis flow
- `/restaurant/[placeId]` Restaurant detail page
- `/my-page` Saved restaurants and personal reviews
- `/pricing` Plan and upgrade page

API routes:

- `/api/crawl`
- `/api/summary-basic`
- `/api/analyze`
- `/api/placedetails`
- `/api/create-checkout-session`
- `/api/webhook`

## Local Development

### 1. Install

```bash
npm install
```

### 2. Environment Variables

Create `.env.local` and set values (based on `.env.example`):

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_JS_URL=https://maps.googleapis.com/maps/api/js
NEXT_PUBLIC_GOOGLE_MAPS_LIBRARIES=places,geometry
GOOGLE_MAPS_PLACES_DETAILS_URL=https://maps.googleapis.com/maps/api/place/details/json
GOOGLE_MAPS_PHOTO_URL=https://maps.googleapis.com/maps/api/place/photo

GOOGLE_GEMINI_API_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_EMAIL_REDIRECT_URL=http://localhost:3000

# Optional (Stripe)
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional (analysis quota per user, default: 3)
ANALYSIS_USAGE_LIMIT=3
```

### 3. Run

```bash
npm run dev
```

### 4. Production Build Check

```bash
npm run build
```

## Database Migrations (Supabase)

Apply migrations in `supabase/migrations`:

- `create_tables.sql`
- `20240320000000_create_summaries.sql`
- `20260211000100_create_user_api_usage.sql`

The `user_api_usage` table is used for server-side per-user analysis quota enforcement.

## Usage Limit Behavior

- Quota is tracked by authenticated `user_id`
- On quota exceed, API returns HTTP `429` (`USAGE_LIMIT_EXCEEDED`)
- Frontend redirects users to `/pricing`

## Deployment (Vercel)

1. Connect repository to Vercel
2. Set all required environment variables in Vercel Project Settings
3. Ensure Supabase migrations are applied to the production DB
4. Deploy `main`

## Notes

- This project currently uses `@supabase/auth-helpers-nextjs` (deprecated notice may appear in install logs).
- Keep Next.js and dependencies updated to pass Vercel security checks.
