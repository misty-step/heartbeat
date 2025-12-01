# Heartbeat

> Set and forget uptime monitoring

![Coverage](https://img.shields.io/badge/coverage-unknown-lightgrey)

Beautiful status pages and real-time monitoring for your services. Built with Next.js, Convex, and Clerk.

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm (or npm)
- Convex account (free at [convex.dev](https://convex.dev))
- Clerk account (free at [clerk.com](https://clerk.com))

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Convex

```bash
# Login to Convex
pnpm convex login

# Initialize Convex project (creates deployment)
pnpm convex dev
```

This will:
- Create a new Convex deployment
- Generate `convex/_generated/` types
- Start the Convex dev server
- Print your deployment URL

**Copy the deployment URL** - you'll need it for `.env.local`

### 3. Set Up Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create a new application
3. Get your API keys from the "API Keys" section
4. Get your JWT issuer domain from "JWT Templates" → Default → Issuer

### 4. Configure Environment Variables

Create `.env.local` in the project root:

```bash
# Convex (from step 2)
CONVEX_DEPLOYMENT=prod:your-deployment-name-12345
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk (from step 3)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_ISSUER_DOMAIN=your-app.clerk.accounts.dev

# Optional: Resend (for email notifications)
RESEND_API_KEY=re_...
```

### 5. Run the Development Server

```bash
# Runs both Next.js and Convex dev servers concurrently
pnpm dev
```

Note: This runs both servers in a single terminal with colored output:
- Cyan: Next.js dev server
- Magenta: Convex dev server

If you prefer to run them separately:
```bash
# Terminal 1: Convex dev server
pnpm dev:convex

# Terminal 2: Next.js dev server
pnpm dev:next
```

### 6. Open the App

Navigate to [http://localhost:3000](http://localhost:3000)

## Features

### Core Functionality

- ✅ **HTTP Monitoring**: Check any URL every 1-5 minutes
- ✅ **Status Pages**: Public status pages at `/s/[project-slug]`
- ✅ **Real-time Dashboard**: Live updates via Convex subscriptions
- ✅ **Incident Tracking**: Automatic incident creation after 3 consecutive failures
- ✅ **Uptime Stats**: 30-day uptime percentage and response time trends
- ✅ **Mobile Responsive**: Touch-optimized interface for all devices

### User Interface

- **Landing Page**: `/` - Marketing page with feature overview
- **Dashboard**: `/dashboard` - View and manage all monitors
- **Status Pages**: `/s/[slug]` - Public status pages (ISR cached, 60s revalidation)
- **Monitor Management**: Create, edit, delete monitors with real-time updates

### Monitoring Engine

- **Cron-based**: Runs every minute via Convex crons
- **Smart Failure Detection**: 3 consecutive failures before incident
- **Status Tracking**: Up / Degraded / Down states
- **Response Time**: Measures and stores response times
- **Data Retention**: Automatic cleanup of checks older than 30 days

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Convex (serverless database + functions + cron)
- **Auth**: Clerk (authentication & user management)
- **Monitoring**: HTTP checks via Convex actions
- **Email**: Resend (optional, for incident notifications)
- **Fonts**: Geist Sans & Geist Mono
- **Icons**: Lucide React
- **Charts**: Recharts

## Project Structure

```
heartbeat/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Authenticated dashboard
│   ├── s/[slug]/          # Public status pages (ISR)
│   ├── layout.tsx         # Root layout with fonts & providers
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── StatusIndicator.tsx
│   ├── MonitorCard.tsx
│   ├── StatusHeader.tsx
│   ├── UptimeChart.tsx
│   ├── IncidentTimeline.tsx
│   ├── AddMonitorForm.tsx
│   ├── MonitorSettingsModal.tsx
│   └── DashboardMonitorCard.tsx
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── monitors.ts        # Monitor CRUD operations
│   ├── checks.ts          # Check history queries
│   ├── incidents.ts       # Incident queries
│   ├── monitoring.ts      # Core monitoring engine
│   ├── crons.ts           # Scheduled jobs
│   └── auth.config.ts     # Clerk integration
└── public/                # Static assets
```

## Database Schema

### monitors
- Monitor configuration (name, URL, interval, etc.)
- User ownership via `userId`
- Project grouping via `projectSlug`
- Status tracking (`consecutiveFailures`, `lastCheckAt`, `lastResponseTime`)

### checks
- Historical check results
- Status (up/down/degraded)
- Response time measurements
- Error messages for failures

### incidents
- Incident records (investigating/identified/resolved)
- Start and end timestamps
- Associated with specific monitors

## Development Commands

```bash
# Development
pnpm dev              # Start Next.js dev server
pnpm convex dev       # Start Convex dev server

# Type checking
pnpm type-check       # Run TypeScript compiler

# Linting
pnpm lint             # Run ESLint

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Convex
pnpm convex deploy    # Deploy to production
pnpm convex dashboard # Open Convex dashboard
```

## Testing the App

### 1. Create Your First Monitor

1. Sign in at `/dashboard` (Clerk will handle registration)
2. Click "Add Monitor" button
3. Fill in:
   - **Name**: "My API"
   - **URL**: `https://httpstat.us/200` (always returns 200 OK)
   - **Project Slug**: `my-project` (auto-generated from name)
   - **Check Interval**: 60 seconds
4. Click "Create Monitor"

### 2. View Status Page

Navigate to `/s/my-project` to see your public status page.

### 3. Test Monitoring

The monitoring cron runs every minute. You can:

- **Test success**: Use `https://httpstat.us/200`
- **Test failure**: Use `https://httpstat.us/500`
- **Test flaky**: Use `https://httpstat.us/random/200,500`

After 3 consecutive failures, an incident will be created automatically.

### 4. Monitor Dashboard Features

- Click on a monitor card to expand and see recent checks
- Click the settings icon to edit monitor configuration
- Click the play icon to manually trigger a check (TODO)

## Monitoring Engine Details

### How It Works

1. **Cron Job**: Runs every 60 seconds via `convex/crons.ts`
2. **Check Due Monitors**: Queries monitors where `lastCheckAt + interval < now`
3. **Execute Checks**: Parallel HTTP requests with timeout
4. **Record Results**: Store check result in `checks` table
5. **Update Status**: Increment `consecutiveFailures` or reset to 0
6. **Incident Management**:
   - 3+ failures → Create incident (if none exists)
   - 0 failures → Resolve open incident

### Status States

- **Up**: 0 consecutive failures (green)
- **Degraded**: 1-2 consecutive failures (yellow)
- **Down**: 3+ consecutive failures (red)

### Data Retention

- **Checks**: Kept for 30 days, then auto-deleted
- **Incidents**: Kept forever (historical record)
- **Monitors**: Kept until manually deleted

## Common Issues

### "Module not found" errors

Run `pnpm convex dev` to generate types in `convex/_generated/`

### Authentication not working

1. Check `.env.local` has correct Clerk keys
2. Verify `CLERK_JWT_ISSUER_DOMAIN` matches your Clerk dashboard
3. Restart Next.js dev server after env changes

### Monitors not being checked

1. Check Convex dashboard shows cron executions
2. Verify monitors are `enabled: true`
3. Check monitor `lastCheckAt` is being updated
4. Look for errors in Convex logs

### Status page shows 404

Ensure monitors exist with that `projectSlug` in database

## Production Deployment

See `TODO.md` Phase 7 for production deployment steps (Vercel + Convex production deployment).

## License

Private project - not licensed for redistribution.

## Built With

- [Next.js](https://nextjs.org/)
- [Convex](https://convex.dev/)
- [Clerk](https://clerk.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)
