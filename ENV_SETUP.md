# Environment Variables Setup Guide

This guide will help you create the necessary `.env` files for both backend and frontend.

## Backend Environment File (`apps/api/.env`)

Create `apps/api/.env` with the following content:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
# PostgreSQL connection string (format: postgresql://user:password@host:port/database)
# For AWS RDS, use format: postgresql://username:password@your-rds-endpoint.region.rds.amazonaws.com:5432/sharetea
DATABASE_URL=postgresql://user:password@localhost:5432/sharetea

# JWT Authentication
# Generate a strong random string for production (e.g., openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_key_change_in_production

# Google OAuth 2.0 Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/apis/credentials
# 1. Create OAuth 2.0 Client ID
# 2. Add authorized redirect URI: http://localhost:5001/auth/google/callback (for local)
# 3. Add your production callback URL for deployed environments
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback

# External API Keys (Optional but recommended)
# OpenWeather API: https://openweathermap.org/api
# Sign up for free API key and replace below
OPENWEATHER_API_KEY=your_openweather_api_key

# OpenAI API: https://platform.openai.com/api-keys
# Required for AI menu recommendations feature
OPENAI_API_KEY=your_openai_api_key

# CORS Configuration
# Comma-separated list of allowed frontend origins
# For production, add your Vercel/deployed frontend URL
FRONTEND_URL=http://localhost:5173
```

## Frontend Environment File (`apps/web/.env`)

Create `apps/web/.env` with the following content:

```env
# API Configuration
# Backend API base URL
# For local development: http://localhost:5001
# For production: https://your-backend-url.com
VITE_API_URL=http://localhost:5001
```

## Quick Setup Commands

### On Unix/Linux/Mac:

```bash
# Backend
cat > apps/api/.env << 'EOF'
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/sharetea
JWT_SECRET=your_jwt_secret_key_change_in_production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback
OPENWEATHER_API_KEY=your_openweather_api_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:5173
EOF

# Frontend
cat > apps/web/.env << 'EOF'
VITE_API_URL=http://localhost:5001
EOF
```

### On Windows PowerShell:

```powershell
# Backend
@"
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/sharetea
JWT_SECRET=your_jwt_secret_key_change_in_production
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/auth/google/callback
OPENWEATHER_API_KEY=your_openweather_api_key
OPENAI_API_KEY=your_openai_api_key
FRONTEND_URL=http://localhost:5173
"@ | Out-File -FilePath apps/api/.env -Encoding utf8

# Frontend
@"
VITE_API_URL=http://localhost:5001
"@ | Out-File -FilePath apps/web/.env -Encoding utf8
```

## Important Notes

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Replace placeholder values** with your actual credentials
3. **For production**, use strong secrets and secure API keys
4. **Generate JWT_SECRET** using: `openssl rand -base64 32`
5. **Google OAuth** requires setting up credentials in Google Cloud Console
6. **Database URL** format must match PostgreSQL connection string format exactly

## Verification

After creating the files, verify they exist:

```bash
# Check backend .env exists
ls apps/api/.env

# Check frontend .env exists
ls apps/web/.env
```

## Next Steps

1. Fill in all placeholder values with your actual credentials
2. Set up Google OAuth credentials (see README.md for instructions)
3. Configure your PostgreSQL database
4. Run migrations: `npm run migrate --workspace @sharetea/api`
5. Start the servers: `npm run dev`

