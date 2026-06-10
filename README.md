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

## License

Private project - All rights reserved

