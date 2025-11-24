# Deployment Checklist

Use this checklist to ship the consolidated Sharetea build: a single Vite frontend backed by Supabase.

---

## 1. Pre-Deployment

### Supabase
- [ ] Supabase project created and reachable.
- [ ] Database schema + RLS policies applied (run SQL from `supabase/config.toml` or the SQL editor).
- [ ] Roles seeded: Manager, Cashier, Barista, Customer.
- [ ] Storage buckets (if used) created with correct access policies.
- [ ] OAuth providers configured directly in Supabase if needed (no Express proxy required).

### Frontend
- [ ] `.env` exists at repo root (see `ENV_SETUP.md`) with:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] Optional API keys (`VITE_OPENWEATHER_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_FOODDATA_API_KEY`)
- [ ] Dependencies installed: `npm install`
- [ ] Quality gates pass: `npm run lint` (and tests if applicable)
- [ ] Production build verified locally: `npm run build` (outputs to `dist`)
- [ ] `vercel.json` points to `dist` and doesn’t reference Express routes.

---

## 2. Deployment Steps

### Step A – Finalize Supabase
1. Run schema migrations/SQL to ensure tables + roles exist.
2. Confirm Row-Level Security is enabled everywhere.
3. Grab the Supabase project URL and anon key (Settings → API).

### Step B – Deploy Frontend (Vercel example)
1. Connect repository to Vercel or run `vercel --prod`.
2. In Vercel → Project Settings → Environment Variables add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional `VITE_OPENWEATHER_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_FOODDATA_API_KEY`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Trigger deployment and wait for completion.

### Alternative Hosts
- **Netlify**: build command `npm run build`, publish directory `dist`, set env vars under Site Settings.
- **Render Static Site**: same build/output; add env vars under Environment → Add Secret/Env Var.

---

## 3. Post-Deployment Verification

### Functional
- [ ] Landing page loads at production URL with no console errors.
- [ ] User can sign up without an email and lands on the correct role route.
- [ ] Existing accounts can sign in via username or email.
- [ ] Menu browse → add to cart → checkout works.
- [ ] Orders propagate to Cashier/Kitchen views.
- [ ] Manager dashboard shows employees, inventory, and reports.
- [ ] Accessibility toolbar toggles font size/contrast.

### Supabase Data
- [ ] New users appear in `users` table with matching `role_id`.
- [ ] Inventory/menu updates persist via Supabase mutations.
- [ ] Policies block unauthenticated access (test via curl or Supabase SQL runner).

---

## 4. Troubleshooting

- **Auth errors** → verify Supabase anon key + URL, ensure `roles` table values are spelled correctly.
- **Build failures** → check Node version (18+), delete `.turbo`/`node_modules` cache and rebuild.
- **API 401/403** → confirm Supabase policies allow the operation for the authenticated role.
- **Env vars missing in prod** → double-check they exist for Production and Preview scopes in Vercel.
- **Stale schema** → re-run Supabase migrations or manually sync tables via SQL editor.

---

## 5. Rollback Plan
1. Revert to last known good git commit and redeploy.
2. If Supabase schema broke, restore from the Supabase PITR backup or re-apply previous migration.
3. Keep env vars unchanged unless rotating keys after a leak.

---

## 6. Monitoring & Security
- Enable Supabase logs + database insights for performance tracking.
- Add client-side monitoring (e.g., Sentry) to capture runtime errors.
- Rotate Supabase anon keys periodically; update `.env` + Vercel immediately.
- Enforce MFA on the Supabase org and Vercel workspace.
- Use Vercel/Web Analytics to monitor traffic and Lighthouse scores.

