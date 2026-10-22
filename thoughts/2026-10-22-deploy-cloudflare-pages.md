# Deploy to plasma.luskeren.dk via Cloudflare Pages

## What changed
- `.github/workflows/deploy.yml`: on push to `master` (or manual dispatch) → `npm ci`, `npm run build`, ensure Pages project `plasma` exists (`continue-on-error`, fails harmlessly once it exists), `wrangler pages deploy dist`.
- `scripts/setup-cloudflare-domain.ps1`: one-time idempotent script that attaches `plasma.luskeren.dk` to the Pages project and upserts a proxied `CNAME plasma → <project>.pages.dev`, removing any other `plasma` records.
- Repo secrets set: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.

## Why
- `luskeren.dk` is on Cloudflare DNS; Pages keeps hosting + DNS in one place. Vite `base: './'` works unchanged at a subdomain root.
- `plasma.luskeren.dk` returned HTTP 522 before: a proxied record (or wildcard) points at a dead origin. The script replaces/overrides it.

## What failed / blockers
- First pasted token (`cfat_…`): `Invalid access token` (9109).
- Second token (`cfut_…`): active, can read the zone, but `/pages/projects` and `/dns_records` both return `Authentication error` (10000). `/accounts` returns an empty list (account ID taken from the zone object instead).
- Required token permissions: **Account → Cloudflare Pages → Edit**, **Zone (luskeren.dk) → DNS → Edit**.

## Remaining steps
1. Grant the token the permissions above (same token = secret already correct; new token = `gh secret set CLOUDFLARE_API_TOKEN`).
2. `git push` (or re-run the workflow) → first deploy creates the project.
3. `$env:CLOUDFLARE_API_TOKEN='…'; ./scripts/setup-cloudflare-domain.ps1`
4. Check `curl -I https://plasma.luskeren.dk` → 200. Rotate the token afterwards since it was pasted in chat.

## Review focus
- If `plasma.pages.dev` was taken, Cloudflare assigns a suffixed subdomain; the script reads it from the project, so the CNAME stays correct.
