# Deployment Checklist

Use this checklist to ensure a successful deployment of Sharetea SaaS MVP.

## Pre-Deployment

### Backend Checklist
- [ ] PostgreSQL database created (local or AWS RDS)
- [ ] Database migrations tested and verified (`npm run migrate --workspace @sharetea/api`)
- [ ] All environment variables documented in `apps/api/.env` (or `.env.example`):
  - [ ] `DATABASE_URL` - PostgreSQL connection string
  - [ ] `JWT_SECRET` - Strong random secret generated
  - [ ] `GOOGLE_CLIENT_ID` - Google OAuth Client ID
  - [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth Secret
  - [ ] `GOOGLE_CALLBACK_URL` - Production callback URL
  - [ ] `OPENWEATHER_API_KEY` - (Optional)
  - [ ] `OPENAI_API_KEY` - (Optional)
  - [ ] `FRONTEND_URL` - Frontend deployment URL
  - [ ] `NODE_ENV` - Set to `production`
  - [ ] `PORT` - Set to `5001`
- [ ] Google OAuth redirect URIs configured for production
- [ ] AWS Elastic Beanstalk application created
- [ ] `.ebextensions/node.config` exists with correct Node.js version
- [ ] Backend builds successfully: `npm run build --workspace @sharetea/api` (if applicable)
- [ ] All backend tests pass: `npm test --workspace @sharetea/api`

### Frontend Checklist
- [ ] All environment variables documented in `apps/web/.env` (or `.env.example`):
  - [ ] `VITE_API_URL` - Backend API URL
- [ ] `vercel.json` configured with correct:
  - [ ] Build command
  - [ ] Output directory (`dist/web`)
  - [ ] API proxy destination (update with actual backend URL)
- [ ] Frontend builds successfully: `npm run build --workspace @sharetea/web`
- [ ] Build output verified in `dist/web` directory
- [ ] All frontend tests pass: `npm test --workspace @sharetea/web`
- [ ] Vercel project created or GitHub repository connected

## Deployment Steps

### 1. Deploy Backend (AWS Elastic Beanstalk)

1. [ ] Package backend application:
   ```bash
   cd apps/api
   zip -r ../api-deploy.zip . -x "node_modules/*" ".env" "__tests__/*"
   ```

2. [ ] Upload to Elastic Beanstalk:
   - Via console: Upload zip file
   - Via CLI: `eb deploy`

3. [ ] Configure environment variables in EB console:
   - Go to Configuration → Software → Environment properties
   - Add all required variables listed above

4. [ ] Wait for deployment to complete

5. [ ] Test health endpoint:
   ```bash
   curl https://your-api.elasticbeanstalk.com/health
   ```

6. [ ] Verify database connection (check logs)

### 2. Deploy Frontend (Vercel)

1. [ ] Update `vercel.json`:
   - Change API proxy destination to your backend URL
   - Example: `"destination": "https://your-api.elasticbeanstalk.com/:path*"`

2. [ ] Commit and push changes:
   ```bash
   git add vercel.json
   git commit -m "Update backend URL for deployment"
   git push
   ```

3. [ ] Deploy via Vercel:
   - Via CLI: `vercel --prod`
   - Via Dashboard: Connect GitHub repo and deploy

4. [ ] Configure environment variables in Vercel:
   - Settings → Environment Variables
   - Add `VITE_API_URL` with backend URL

5. [ ] Wait for deployment to complete

6. [ ] Test frontend URL loads correctly

### 3. Post-Deployment Verification

#### Backend Tests
- [ ] Health endpoint returns 200: `GET /health`
- [ ] Database connection successful (check logs)
- [ ] Google OAuth redirect works: `GET /auth/google`
- [ ] Protected routes require authentication
- [ ] CORS allows frontend origin

#### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Login page accessible
- [ ] Google OAuth login flow works
- [ ] Customer dashboard loads menu items
- [ ] Cart functionality works
- [ ] Order submission works
- [ ] Cashier dashboard displays orders
- [ ] Manager dashboard displays data
- [ ] Menu board displays correctly
- [ ] Accessibility controls work (font size, contrast, language)
- [ ] Google Translate widget loads

#### Integration Tests
- [ ] End-to-end user flow: Login → Browse → Add to Cart → Submit Order
- [ ] Cashier can view and update orders
- [ ] Manager can view reports and inventory
- [ ] Weather API integration works
- [ ] AI recommendations display (or fallback works)

## Troubleshooting Deployment Issues

### Backend Issues
- **502 Bad Gateway**: Check that backend is running and health endpoint responds
- **Database Connection Failed**: Verify `DATABASE_URL` and security groups
- **OAuth Not Working**: Verify redirect URIs match exactly in Google Console
- **CORS Errors**: Check `FRONTEND_URL` includes deployed frontend URL

### Frontend Issues
- **Build Fails**: Check Node.js version matches requirement (18+)
- **API Calls Fail**: Verify `VITE_API_URL` points to correct backend
- **404 on Routes**: Check Vercel rewrites configuration
- **Environment Variables Not Loading**: Ensure variables start with `VITE_` prefix

### Integration Issues
- **OAuth Redirect Loops**: Verify callback URL matches exactly
- **CORS Blocked**: Ensure backend `FRONTEND_URL` includes production URL
- **Token Not Persisting**: Check localStorage access in production

## Rollback Plan

If deployment fails:
1. [ ] Revert to previous working version
2. [ ] Check deployment logs for errors
3. [ ] Verify environment variables are correct
4. [ ] Test locally before re-deploying

## Monitoring

After successful deployment:
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Monitor backend logs for errors
- [ ] Check frontend analytics
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

## Security Checklist

- [ ] All secrets stored in environment variables (not in code)
- [ ] `JWT_SECRET` is strong and unique
- [ ] Database credentials are secure
- [ ] CORS configured to allow only necessary origins
- [ ] HTTPS enabled for all production URLs
- [ ] Google OAuth credentials secured
- [ ] API keys stored securely
- [ ] No sensitive data in frontend code

