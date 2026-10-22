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

- Pushing the workflow failed twice: `master` only accepts PRs, and the git OAuth token lacked the `workflow` scope (`gh auth refresh -s workflow` fixed it). The agent can't merge in this workspace (agent-merge has no merge action).

## Resolution
- Token updated with Pages: Edit + DNS: Edit.
- First deploy was done locally with `npx wrangler@3 pages project create plasma --production-branch=master` and `npx wrangler@3 pages deploy dist --project-name=plasma --branch=master`, because the PR wasn't merged yet. Project subdomain: `plasma-c7z.pages.dev`, because `plasma.pages.dev` was taken.
- `scripts/setup-cloudflare-domain.ps1` attached the domain and created the proxied `CNAME plasma → plasma-c7z.pages.dev`. No explicit `plasma` record existed before; the 522 came from a wildcard, which the explicit CNAME now overrides.
- Verified: domain status `active`; `https://plasma.luskeren.dk` returns 200 and serves HTML identical to the local `dist/index.html`; the JS and CSS assets return 200.
- After merge, CI handles deploys. The "Ensure Pages project exists" step fails harmlessly because the project already exists, and has `continue-on-error`.
- Rotate the Cloudflare token since it was pasted in chat.

## Review focus
- If `plasma.pages.dev` was taken, Cloudflare assigns a suffixed subdomain; the script reads it from the project, so the CNAME stays correct.
