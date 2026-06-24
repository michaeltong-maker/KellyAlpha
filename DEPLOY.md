# Deploying AlphaWalk

The app is a pure static SPA — no backend, no env vars, no secrets. Any static
host will work; the steps below assume Vercel because it's the path of least
resistance.

## One-time setup

```bash
cd alphawalk
npm install               # if you haven't already
```

## Deploy to Vercel

```bash
# First time: install the Vercel CLI globally (or use npx)
npm i -g vercel

# From the alphawalk/ directory:
vercel              # follow the prompts to link / create a project (preview deploy)
vercel --prod       # promote to production
```

That's it. Vercel reads `vercel.json` and:

- Runs `npm run build`
- Serves `dist/` as a static site
- Rewrites every path to `/index.html` so client-side routes (`/chat/seed-1`,
  `/marketplace/seed-3`, etc.) keep working on refresh
- Sets long-lived cache headers on hashed `assets/*`
- Returns `application/manifest+json` for the PWA manifest

You'll get a URL like `alphawalk.vercel.app` (or whatever name you choose).

## Custom domain

In the Vercel dashboard → project → Domains → add the domain you own. Vercel
will give you the CNAME / A record to point at; once DNS propagates, HTTPS is
auto-provisioned via Let's Encrypt.

## Install as a PWA

On the deployed site, mobile users can tap the browser share menu and pick
"Add to Home Screen". The app launches full-screen in portrait, with the brand
purple status bar. iOS shows the icon from `/icon.svg`.

If you want crisper iOS icons later, generate PNG variants from `public/icon.svg`
(180×180 for `apple-touch-icon`, plus 192×192 / 512×512 for the manifest) and
add them to the manifest's `icons` array.

## Other hosts

The same `dist/` directory works on:

- **Netlify**: `npx netlify deploy --prod --dir=dist` (add a `_redirects` file
  with `/*    /index.html   200` for SPA routing)
- **Cloudflare Pages**: connect the repo, set build = `npm run build`, output
  directory = `dist`. Add a `_redirects` file as above for SPA routing.
- **GitHub Pages**: set `base: '/<repo-name>/'` in `vite.config.ts`, then push
  `dist/` to a `gh-pages` branch.

## What still needs real infra before public launch

- **Persistence** — everything lives in `localStorage`. A wipe = total reset.
  Pick Supabase or Firebase for auth + Postgres/Firestore-backed agents,
  chats, results.
- **LLM** — manual runs return canned text. Wire `runNow()` in
  `src/pages/Chat/AgentDetail.tsx` to a real API (Claude / OpenAI) before
  letting outside users in.
- **Market data** — Stooq is fine for prototypes; for production, swap
  `fetchQuote` in `src/lib/stocks.ts` for a licensed provider.
- **Terms of Use** page — `https://alphawalk.ai/terms` is currently a stub.
