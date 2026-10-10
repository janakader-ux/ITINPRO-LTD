# ITIN Pro UK — premium Next.js website

Registered business: **ITIN PRO LTD**, company number **17336134**, 18 Sundew Close, Bedford, England, MK42 0SR.

The site uses original topic-specific editorial imagery for Form W-7, 1040-NR, FIRPTA, Schedule K-1 / Form 8805, 401(k), family applicants, US banking, royalties, inheritance and withholding refunds. It deliberately does not use an IRS seal or an official-looking government endorsement badge.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Secure enquiry setup

1. Create a Supabase project and run `supabase.sql` in its SQL editor.
2. Create a Resend account, verify `itinpro.uk`, and create an API key.
3. Add the values from `.env.example` to `.env.local` and your hosting environment.
4. Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` with a `NEXT_PUBLIC_` prefix.
5. Configure database retention, restricted staff access, MFA and audit logging before collecting real enquiries.

Optional Google Analytics 4 is consent-gated. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` only after creating the property; the tag loads only when a visitor chooses **Allow analytics**.

The public form deliberately refuses passport uploads and tells applicants not to provide passport numbers, tax IDs or bank details.

## GitHub and Vercel deployment — recommended

```bash
git init
git add .
git commit -m "Launch premium ITIN Pro Next.js website"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Then import the repository in Vercel, add the environment variables, connect `itinpro.uk`, and deploy. Vercel provides the Next.js server runtime required by `/api/enquiries` and image optimisation.

## Hostinger deployment

Use a Hostinger plan that explicitly supports persistent Node.js applications. Set:

- Install command: `npm ci`
- Build command: `npm run build`
- Start command: `npm run start`
- Node version: current supported LTS

Add the same environment variables in Hostinger. Ordinary static/shared Git deployment cannot run the enquiry API or Next.js image optimiser. Do not use static export if you need Supabase/Resend form submission.

## Existing links and downloads

Legacy `.html` guide URLs redirect to the matching `/guides/...` route. Existing downloadable assets are retained in `public/downloads/`.

## Pre-deployment checks

```bash
npm ci
npm run typecheck
npm run build
npm audit
```

Repeat these checks after dependency updates and immediately before each production deployment.
