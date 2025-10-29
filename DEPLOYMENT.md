# React App Deployment Guide

## Project Overview

This is a modern React application built with Vite. It features:
- ⚡ Lightning-fast HMR (Hot Module Replacement)
- 🎨 Beautiful gradient UI with modern styling
- 📦 Optimized production builds
- 🚀 Ready for Vercel deployment

## Local Development

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Running Locally

1. Install dependencies (already done):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

3. Build for production:
```bash
npm run build
```

4. Preview production build:
```bash
npm run preview
```

## Deploying to Vercel

### Method 1: Using Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the project:
```bash
vercel
```

4. Follow the prompts:
   - Link to existing project? No
   - What's your project's name? (default or custom name)
   - Which directory is your code located? ./
   - Want to override the settings? No

5. For production deployment:
```bash
vercel --prod
```

### Method 2: Using Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "Add New Project"

4. Import your repository

5. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

6. Click "Deploy"

Your app will be deployed and you'll get a live URL!

### Method 3: GitHub Integration (Automatic Deployments)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. Connect your GitHub repository to Vercel:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Select your repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

3. Every push to your main branch will automatically deploy!

## Environment Variables

If you need environment variables:

1. Create a `.env` file locally:
```
VITE_API_URL=https://api.example.com
```

2. In Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add your variables

Note: Vite requires environment variables to be prefixed with `VITE_`

## Custom Domain

1. In Vercel Dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Build Fails
- Check that all dependencies are listed in `package.json`
- Ensure Node.js version compatibility
- Review build logs in Vercel dashboard

### 404 Errors on Routes
- Vercel automatically handles client-side routing for Vite apps
- If issues persist, ensure `vercel.json` is properly configured

### Slow Build Times
- Consider optimizing dependencies
- Use dynamic imports for code splitting
- Check bundle size with `npm run build`

## Useful Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Vercel Documentation](https://vercel.com/docs)

## Support

For issues or questions:
- Check Vercel's [troubleshooting guide](https://vercel.com/docs/troubleshooting)
- Visit [Vercel's community forum](https://github.com/vercel/vercel/discussions)

