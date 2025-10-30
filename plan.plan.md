<!-- f3ea6efe-a8e1-4a4d-90bd-1c10bfa44d93 bfe0b940-7a4a-4a4b-9627-9e87075f52d0 -->
# Sharetea SaaS MVP Implementation Plan

## Overview

Implement a complete full-stack MVP following Sprint 1 requirements, organized as a monorepo with backend (Express.js) and frontend (React) applications, integrated with PostgreSQL database, Google OAuth authentication, and accessibility features.

## Phase 1: Backend Setup and Infrastructure

### 1.1 Initialize Backend Structure

- Create `apps/api/package.json` with Express, pg, passport, JWT, and testing dependencies
- Create `apps/api/src/server.js` as main Express application entry point
- Configure `apps/api/.env.example` with all required environment variables
- Set up `apps/api/.gitignore` to exclude node_modules, .env, and build artifacts

### 1.2 Database Configuration

- Create `apps/api/src/config/database.js` with PostgreSQL connection pool using `pg` library
- Implement connection retry logic and health check functionality
- Create `database/schema.sql` with tables: roles, users, menu_items, orders, order_items, payments, inventory_items
- Create `database/seed.sql` with initial data (roles, sample menu items, test users)
- Add `apps/api/scripts/migrate.js` utility script for running migrations

### 1.3 Express Middleware Setup

- Configure CORS in `apps/api/src/server.js` to allow frontend origin
- Add helmet for security headers
- Add morgan for request logging
- Create `apps/api/src/middleware/errorHandler.js` for standardized error responses
- Create `apps/api/src/middleware/auth.js` with JWT authentication and role-based authorization middleware

## Phase 2: Authentication System

### 2.1 Google OAuth Integration

- Create `apps/api/src/config/passport.js` with Google OAuth 2.0 passport strategy
- Configure passport to extract user profile (email, name, id)
- Create `apps/api/src/routes/auth.js` with routes:
  - `GET /auth/google` - Initiate OAuth flow
  - `GET /auth/google/callback` - Handle OAuth callback, create/update user, issue JWT
  - `POST /auth/login` - Traditional login (optional)
  - `GET /auth/verify` - Verify JWT token and return user info

### 2.2 User Management

- Implement user lookup/creation logic in auth callback
- Map Google accounts to existing users table
- Assign default role (Customer) for new users
- Generate JWT tokens with user ID, email, and role information

## Phase 3: REST API Routes

### 3.1 Menu Routes

- Create `apps/api/src/routes/menu.js`:
  - `GET /menu` - List all menu items with optional category/available filters
  - `GET /menu/:id` - Get single menu item details
  - `POST /menu` - Create menu item (Manager only)
  - `PATCH /menu/:id` - Update menu item (Manager only)
  - `DELETE /menu/:id` - Delete menu item (Manager only)

### 3.2 Order Routes

- Create `apps/api/src/routes/orders.js`:
  - `POST /orders` - Create new order with items (transactional)
  - `GET /orders` - List orders (role-based: customers see only their orders)
  - `GET /orders/:id` - Get order details with items
  - `PATCH /orders/:id/status` - Update order status (Cashier/Manager)
  - `GET /orders/kitchen` - Get orders in PREPARING/PAID status

### 3.3 Inventory Routes

- Create `apps/api/src/routes/inventory.js`:
  - `GET /inventory` - List all inventory items
  - `GET /inventory/:id` - Get single inventory item
  - `POST /inventory` - Add inventory item (Manager only)
  - `PATCH /inventory/:id` - Update inventory quantity (Manager only)

### 3.4 Reports Routes

- Create `apps/api/src/routes/reports.js`:
  - `GET /reports/sales` - Sales summary (Manager only)
  - `GET /reports/inventory` - Inventory status report (Manager only)

### 3.5 External API Integrations

- Create `apps/api/src/services/weatherService.js` for OpenWeather API integration
- Create `apps/api/src/routes/weather.js` with `GET /weather` endpoint
- Create `apps/api/src/services/openaiService.js` for OpenAI menu recommendations
- Add `GET /api/recommendations` endpoint for drink suggestions based on weather

## Phase 4: Frontend Setup

### 4.1 React Application Structure

- Migrate or create `apps/web/package.json` with React, React Router, Axios, Zustand, Tailwind CSS
- Create `apps/web/vite.config.js` configured for React
- Create `apps/web/src/main.jsx` as application entry point
- Create `apps/web/src/App.jsx` with React Router setup
- Configure `apps/web/.env.example` with `VITE_API_URL`

### 4.2 Routing and Navigation

- Create `apps/web/src/router/index.jsx` with routes:
  - `/login` - Login page
  - `/auth/callback` - OAuth callback handler
  - `/manager` - Manager dashboard (protected)
  - `/cashier` - Cashier dashboard (protected)
  - `/customer` - Customer ordering interface (protected)
  - `/menu-board` - Public menu board view
- Create `apps/web/src/components/ProtectedRoute.jsx` for route guards
- Create `apps/web/src/components/Navbar.jsx` with role-based navigation

### 4.3 State Management

- Create `apps/web/src/stores/authStore.js` using Zustand for authentication state
- Implement login, logout, and token persistence
- Create `apps/web/src/api/client.js` with Axios instance and interceptors
- Configure automatic token injection in request headers

## Phase 5: Frontend Pages and Components

### 5.1 Authentication Pages

- Create `apps/web/src/pages/LoginPage.jsx` with Google OAuth button
- Handle OAuth callback and token storage
- Implement role-based redirect after login

### 5.2 Customer Interface

- Create `apps/web/src/pages/CustomerDashboard.jsx`:
  - Menu item grid with category filters
  - Shopping cart component with quantity controls
  - Order submission form
  - Order confirmation screen
- Create `apps/web/src/components/Cart.jsx` for cart state management
- Create `apps/web/src/components/MenuItemCard.jsx` for displaying menu items

### 5.3 Cashier Interface

- Create `apps/web/src/pages/CashierDashboard.jsx`:
  - Active orders list with status indicators
  - Mark order as paid functionality
  - Payment method selection
  - Order details view

### 5.4 Manager Interface

- Create `apps/web/src/pages/ManagerDashboard.jsx`:
  - Menu management table (read-only for Sprint 1)
  - Weather widget using OpenWeather API
  - Placeholder tabs for Inventory and Reports
  - Sales chart placeholder

### 5.5 Public Menu Board

- Create `apps/web/src/pages/MenuBoard.jsx`:
  - Large-type menu display grouped by category
  - Auto-refresh every 60 seconds
  - Current time display
  - Weather information display

## Phase 6: Accessibility Features

### 6.1 Accessibility Context and Controls

- Create `apps/web/src/context/AccessibilityContext.jsx`:
  - Font size state (12px-24px range)
  - High contrast theme toggle
  - Language preference (Spanish/English)
  - LocalStorage persistence
- Create `apps/web/src/components/AccessibilityControls.jsx`:
  - Font size slider (A+, A- buttons)
  - High contrast toggle button
  - Language selector dropdown

### 6.2 WCAG Compliance

- Implement semantic HTML throughout components
- Add ARIA labels and roles to interactive elements
- Ensure keyboard navigation (tab order, focus rings, skip links)
- Create `apps/web/src/components/ErrorBoundary.jsx` for error handling
- Add loading skeletons and states
- Configure Tailwind CSS with accessible color contrast ratios

### 6.3 Google Translate Integration

- Integrate Google Translate API/widget in customer view
- Add language toggle for Maria persona requirement
- Store language preference in localStorage

## Phase 7: Testing and Documentation

### 7.1 Backend Testing

- Create `apps/api/src/__tests__/routes/menu.test.js` with Jest and Supertest
- Create `apps/api/src/__tests__/routes/orders.test.js`
- Create `apps/api/src/__tests__/auth.test.js`
- Add test scripts to package.json

### 7.2 Frontend Testing

- Create `apps/web/src/__tests__/components/Cart.test.jsx` with React Testing Library
- Create `apps/web/src/__tests__/pages/LoginPage.test.jsx`
- Configure Jest and React Testing Library

### 7.3 Documentation

- Update `README.md` with:
  - Project structure overview
  - Setup instructions for local development
  - Environment variable documentation
  - Database migration instructions
  - Deployment URLs and credentials
  - API endpoint documentation
- Create `database/README.md` with schema documentation

## Phase 8: Deployment Configuration

### 8.1 Backend Deployment

- Create `apps/api/.ebextensions/` for AWS Elastic Beanstalk configuration (if using EB)
- Or create `apps/api/render.yaml` for Render deployment
- Configure environment variables for production
- Set up process manager (PM2) configuration if needed

### 8.2 Frontend Deployment

- Update `vercel.json` or create `apps/web/vercel.json` for Vercel deployment
- Configure build settings and environment variables
- Set up proxy for API calls if needed

### 8.3 Environment Configuration

- Document all required environment variables in both `.env.example` files
- Create deployment checklist
- Set up CI/CD pipeline documentation (GitHub Actions if needed)

## File Structure Summary

```
Project3/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── database.js
│   │   │   │   └── passport.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.js
│   │   │   │   └── errorHandler.js
│   │   │   ├── routes/
│   │   │   │   ├── auth.js
│   │   │   │   ├── menu.js
│   │   │   │   ├── orders.js
│   │   │   │   ├── inventory.js
│   │   │   │   ├── reports.js
│   │   │   │   └── weather.js
│   │   │   ├── services/
│   │   │   │   ├── weatherService.js
│   │   │   │   └── openaiService.js
│   │   │   ├── __tests__/
│   │   │   └── server.js
│   │   ├── scripts/
│   │   │   └── migrate.js
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── .gitignore
│   └── web/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ProtectedRoute.jsx
│       │   │   ├── Navbar.jsx
│       │   │   ├── Cart.jsx
│       │   │   ├── MenuItemCard.jsx
│       │   │   ├── AccessibilityControls.jsx
│       │   │   └── ErrorBoundary.jsx
│       │   ├── pages/
│       │   │   ├── LoginPage.jsx
│       │   │   ├── CustomerDashboard.jsx
│       │   │   ├── CashierDashboard.jsx
│       │   │   ├── ManagerDashboard.jsx
│       │   │   └── MenuBoard.jsx
│       │   ├── context/
│       │   │   └── AccessibilityContext.jsx
│       │   ├── stores/
│       │   │   └── authStore.js
│       │   ├── api/
│       │   │   └── client.js
│       │   ├── router/
│       │   │   └── index.jsx
│       │   ├── __tests__/
│       │   ├── App.jsx
│       │   └── main.jsx
│       ├── public/
│       ├── package.json
│       ├── vite.config.js
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── .env.example
│       └── .gitignore
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── README.md
├── README.md
└── package.json (root)
```

## Implementation Order

1. Backend foundation (database, server, middleware)
2. Authentication system (OAuth, JWT)
3. Core API routes (menu, orders)
4. Frontend foundation (routing, state management)
5. Authentication UI and protected routes
6. Customer interface (menu, cart, orders)
7. Cashier and Manager dashboards
8. Accessibility features
9. External API integrations
10. Testing and documentation
11. Deployment configuration

### To-dos

- [ ] Initialize backend Express.js application with package.json, server.js, database configuration, and middleware setup
- [ ] Create PostgreSQL schema.sql and seed.sql files with all required tables (users, roles, menu_items, orders, order_items, payments, inventory_items)
- [ ] Implement Google OAuth2 backend (passport configuration, auth routes, JWT token generation, user mapping)
- [ ] Create REST API routes: /menu, /orders, /inventory, /reports with CRUD operations and role-based access control
- [ ] Integrate external APIs: OpenWeather service, OpenAI service for recommendations, Google Translate API
- [ ] Initialize React frontend with Vite, React Router, Zustand state management, Axios client, and Tailwind CSS configuration
- [ ] Build login page with Google OAuth button, OAuth callback handler, auth store, and protected route components
- [ ] Create customer dashboard with menu display, shopping cart, order submission, and confirmation screens
- [ ] Build cashier dashboard with active orders list, payment processing, and order status management
- [ ] Create manager dashboard with menu table, weather widget, and placeholder tabs for inventory/reports
- [ ] Implement accessibility context, font size controls (A+/A-), high contrast toggle, keyboard navigation, ARIA labels, and Google Translate integration
- [ ] Create public menu board page with large text, auto-refresh, clock display, and weather integration
- [ ] Write unit tests for backend routes (Jest + Supertest) and frontend components (React Testing Library)
- [ ] Update README.md with setup instructions, environment variables, deployment URLs, and API documentation
- [ ] Configure deployment files for backend (AWS EB/Render) and frontend (Vercel), including environment variables and build settings