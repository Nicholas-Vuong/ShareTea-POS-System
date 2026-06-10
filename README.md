# Sharetea SaaS - Bubble Tea Shop Management System

A complete full-stack bubble tea shop management system with POS, customer kiosk, kitchen display, and manager dashboard.

## Features

### Views
- **Login (`/login`)** - Employee authentication with role-based access
- **Cashier POS (`/cashier`)** - Full order builder with customizations
- **Customer Kiosk (`/kiosk`)** - WCAG 2.1 compliant self-service interface
- **Kitchen Display (`/kitchen`)** - Real-time ticket queue management
- **Menu Boards (`/menu-boards`)** - Auto-cycling 4K-safe displays with weather integration
- **Manager Dashboard (`/manager`)** - Menu, inventory, employee, and sales management

### Accessibility Features (WCAG 2.1)
- High contrast mode toggle
- Text scaling (100%, 125%, 150%)
- Bilingual support (EN/ES)
- 48px+ touch targets on kiosk
- Keyboard navigation
- Screen reader support

### Order Customization
- Size: Small, Medium, Large
- Sugar level: 0%, 25%, 50%, 75%, 100%
- Ice level: No Ice, Less Ice, Normal, Extra Ice
- Toppings: Multiple options (Tapioca Pearls, Popping Boba, etc.)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for cart, auth, and accessibility
- **Routing**: React Router v6
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **API Integration**: WeatherAPI.com for weather data

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- WeatherAPI.com API key (optional, for weather features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_WEATHERAPI_KEY=your-weatherapi-key
   ```

   Get your Supabase credentials from: Supabase Dashboard → Settings → API

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:8080`

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Project Structure

```
src/
├── components/     # React components
├── pages/          # Page components
├── lib/            # Utilities and API clients
├── store/          # Zustand state management
├── hooks/          # Custom React hooks
└── integrations/   # Third-party integrations (Supabase)
```

## Development

- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Preview**: `npm run preview`

# Sprint 3 Final Release

## Deployed Application
https://project3-gangx1.vercel.app/

## Overview
This Sprint 3 release finalizes the SwiftServe platform with all remaining features, accessibility requirements, and deployment tasks completed. The system is now fully functional across all user roles.

Sprint 3 focused on stability, authentication, accessibility completion, and preparation for the final demo. All features were regression-tested and verified in the production environment.

## Key Updates

### Authentication & Infrastructure
- OAuth2 login fully integrated  
- OTP messaging system completed  
- Monitoring alerts and backup workflow implemented  
- Domain + SSL and RDS configuration finalized  

### Accessibility Completion
- Resizable text  
- High contrast mode  
- Keyboard navigation  
- Screen reader labels  
- Persona flows (Maria, Vishnu, Carol) verified  

### Core Features Finalized
- Guest ordering and points system  
- Seasonal item timing rules  
- Full end-to-end flow testing

### Deployment & Testing
- Full regression pass across all sprints  
- Accessibility re-testing performed  
- All documentation and demo materials completed  

## Summary
Sprint 3 completes the SwiftServe platform with full functionality, accessibility compliance, API integration, and production deployment readiness. The system is stable, feature-complete, and prepared for the final comprehensive demo.

# Sprint 2 - MVP Release

Frontend Focus: Sprint 2 MVP Release

Deployed Application:
https://project3-gangx1.vercel.app/

Overview

This release marks the completion of Sprint 2, introducing major functional improvements, API integrations, UI enhancements, and accessibility features across the customer interface and supporting systems. All Sprint 2 backlog items have been fully implemented, tested, and deployed. This version expands the MVP into a more robust, interactive, and accessible POS customer-facing experience.

Sprint 2 focused on integrating external APIs, enhancing usability, developing advanced UI flows such as checkout and order confirmation, and strengthening system reliability through error recovery and auto-refresh mechanisms.

All planned Sprint 2 tasks were completed and verified using the sprint test plan.

# Frontend Focus: Sprint 1 MVP Release

https://project3-gangx1.vercel.app/

## Overview  
This release marks the **successful completion of Sprint 1**, delivering a **fully deployed Minimum Viable Product (MVP)** with core frontend and backend functionality. The customer interface is live, interactive, and ready for user feedback. All planned Sprint 1 backlog items are implemented, tested, and deployed.

## Completed Sprint 1 Features (All Functional & Deployed)

| Feature | Description | Status |
|-------|-----------|--------|
| **Frontend Setup** | React + Vite, responsive layout, routing, theme | Done |
| **Backend API** | Express server, PostgreSQL integration, CRUD endpoints | Done |
| **Authentication Flow** | Login screen, session management, protected routes | Done |
| **Menu Display** | Dynamic menu loading from database | Done |
| **Order Builder** | Add/remove items, real-time total, discount logic | Done |
| **Order Submission** | POST to `/api/orders`, receipt generation | Done |
| **Database Sync** | Live menu and order persistence | Done |

## License

Private project - All rights reserved

