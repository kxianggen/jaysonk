# jaysonk — Jayson Kong's portfolio

One-page portfolio: a pencil-sketch hero whose words swing and fall when you click a link,
then Education, Experience, Projects, Skills and Certifications.

Built with Next.js, matter-js (word physics), Geist fonts and Simple Icons. Hosted on Vercel.

## Edit the content
Everything you read on the page lives in **`lib/content.ts`** — job descriptions, projects,
skills, certification links, and the positions/angles of the hero words. Change it, commit,
and Vercel redeploys automatically.

Placeholders to fill in later:
- `projects` → AI Newsletter SaaS `github: null` → put the repo URL.
- `certifications` → each `href: null` → the certificate URL; add `date` when you have it.
  When the IBM certificate is issued, remove its "Expected" pill and add the date.

Images live in `public/`: `hero-sketch-*.webp`, `previews/*.webp` (hover previews),
`resume.pdf` (opened by the RESUME link — replace the file to update it).

## Run locally
```
npm install
npm run dev
```
Open http://localhost:3000.
