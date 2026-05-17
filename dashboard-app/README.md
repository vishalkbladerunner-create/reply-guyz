# ReplyGuyz Dashboard

A premium analytics dashboard for ReplyGuyz clients to view social media performance across Twitter, Instagram, and Telegram.

## Features

- **Role-based access**: Admin (upload/manage data) and Client (view-only)
- **Multi-platform analytics**: Twitter/X, Instagram, Telegram
- **Date range filtering**: Presets + Custom range
- **Visual charts**: Line, bar, pie charts using Chart.js
- **Weekly/Monthly reports**: Auto-generated with CSV export
- **Engagement orders**: Track paid/boost campaigns
- **File upload**: Import CSV and Excel files (Admin only)
- **Responsive design**: Works on desktop and mobile

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Supabase (Auth + PostgreSQL)
- Chart.js
- Lucide React icons

## Setup

1. Copy `.env.example` to `.env` and add your Supabase credentials:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

2. Run the SQL in `supabase-setup.sql` in your Supabase SQL Editor

3. Install dependencies:
```bash
npm install
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## Vercel Deployment

The dashboard is pre-built and copied to `/dashboard/` folder at project root. Vercel serves it as static files with SPA routing configured in `vercel.json`.

To rebuild after making changes:
```bash
cd dashboard-app
npm run build
rm -rf ../dashboard/assets ../dashboard/index.html
cp -r dist/* ../dashboard/
```

Then commit and push to deploy.
