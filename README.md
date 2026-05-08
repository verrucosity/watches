# ChronoVault

ChronoVault is a premium Next.js watch market dashboard focused on price tracking from entry-level references to top-tier haute horology.

## Highlights

- Curated multi-tier watch catalog (Entry, Mid, High, Haute)
- Fast search by brand, model, or reference
- Price and tier filters
- Personal tracker with target price alerts and notes
- Owned collection vault with purchase data and unrealized gain/loss
- Tier radar section for market segmentation
- Local persistence via browser localStorage
- Designed for desktop and mobile

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS v4 utilities

## Run Locally

```bash
npm install
npm run dev
```

App runs at http://localhost:3000

## Production Checks

```bash
npm run lint
npm run build
```

## Deploy on Vercel

This app is Vercel-ready.

```bash
npm run build
```

Then import the repository in Vercel and deploy with default Next.js settings.
