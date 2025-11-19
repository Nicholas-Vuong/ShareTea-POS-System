# Environment Variables Setup Guide

This project now ships as a single Vite + Supabase app. All configuration lives in one `.env` file at the repository root.

## Frontend/Supabase Environment File (`.env`)

Create `.env` with the following content:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key

# Optional integrations
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_FOODDATA_API_KEY=your_usda_fooddata_api_key

# Used for generating absolute URLs in a few helpers
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

> All Vite environment variables must start with `VITE_`. Never include secrets that should remain private to a backend service—Supabase Row-Level Security (RLS) protects the database.

## Quick Setup Commands

### On Unix/Linux/Mac

```bash
cat > .env <<'EOF'
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_FOODDATA_API_KEY=your_usda_fooddata_api_key
VITE_PUBLIC_SITE_URL=http://localhost:5173
EOF
```

### On Windows PowerShell

```powershell
@"
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_public_anon_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_FOODDATA_API_KEY=your_usda_fooddata_api_key
VITE_PUBLIC_SITE_URL=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8
```

## Important Notes

1. **Never commit `.env` files**—they are already ignored.
2. **Replace placeholders** with real credentials before running the app.
3. **Rotate keys regularly** in production (Supabase dashboard → Settings → API).
4. **Add OAuth providers** directly in Supabase if you need Google/Apple login; no Express proxy is required.
5. **Server-only secrets** (if you add serverless functions later) should live in a separate `.env.server` or your hosting platform’s secret manager without the `VITE_` prefix.

## Verification

```bash
# Confirm the env file exists at the repo root
ls .env
```

## Next Steps

1. Configure your Supabase project using `supabase/config.toml` as a reference (tables, roles, policies).
2. Populate `.env` with the URL + anon key from Supabase.
3. Optional: add third-party API keys (OpenWeather, OpenAI, USDA).
4. Start developing: `npm install && npm run dev`.

