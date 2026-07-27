# Northbound — Focus & Project Dashboard

A responsive analytics/admin dashboard built with **semantic HTML5**, **modern CSS (Grid + Flexbox)**, and **vanilla JavaScript** — no frameworks, no build step.

**[Live demo →](#)** *(add your deployed link here once published)*

![Northbound dashboard preview](preview.png)

## Why this project

Most beginner portfolios ship a landing page. This is a **dashboard UI** instead, because dashboards force the layout problems real front-end work actually involves: a fixed sidebar, a responsive data table, cards, a mini chart, and information hierarchy — not just a hero and a footer.

## Features

- Fully responsive layout — collapsible sidebar on mobile, stacked table on small screens
- Live search/filter on the projects table (vanilla JS, no dependencies)
- Custom SVG radial progress indicator ("compass") animated on load
- Pure CSS bar chart for weekly focus hours (no chart library)
- Accessible by default: semantic landmarks, visible focus states, `aria-label`s on non-text visuals, `prefers-reduced-motion` respected
- Design token system in CSS custom properties for consistent color/type/spacing

## Tech stack

| Layer | Choice |
|---|---|
| Markup | Semantic HTML5 (`<nav>`, `<main>`, `<table>`, `<time>`) |
| Styling | CSS3 — Grid, Flexbox, custom properties, no preprocessor |
| Interactivity | Vanilla JavaScript (ES6) |
| Fonts | Fraunces (display), Inter (body), JetBrains Mono (data) via Google Fonts |

## Project structure

```
dashboard-project/
├── index.html          # Page structure, login screen + dashboard
├── style.css            # Design tokens + all styling
├── script.js             # Supabase Auth + Database, sidebar, search, ring animation
├── supabase-config.js     # Your Supabase project URL + anon key go here
├── supabase-setup.sql      # Run once in Supabase's SQL Editor: tables + security policies
└── README.md
```

## Backend: Supabase (no Java/Python required, no card required)

This project uses **Supabase** as a Backend-as-a-Service — a real Postgres database
plus real authentication, called directly from `script.js`. There is no server code to
write or host, and the free tier never asks for a credit card.

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → sign in (GitHub login is easiest) → **New project**
2. Give it a name (e.g. `northbound-dashboard`), set a database password($hxL&rv@D%rK7WS), pick a region → **Create**
3. Once it's ready: **Project Settings (gear icon) → API**
4. Copy the **Project URL**(https://ptaatcyxoczfykkxmoyk.supabase.co) and the **anon public** key into **`supabase-config.js`**

### 2. Set up the database and tables
1. In the left sidebar: **SQL Editor → New query**
2. Open **`supabase-setup.sql`** from this project, copy its contents, paste them in, click **Run**
3. This creates a `profiles` table (stores each user's role) and a `projects` table
   (your dashboard data), with Row Level Security policies already applied, plus a
   few sample projects to start with

### 3. Turn on Authentication and create your admin login
1. **Authentication → Users → Add user**
2. Enter your email + password → **Create user**
3. Copy the **User UID** it generates

### 4. Grant yourself the admin role
1. **Table Editor → profiles → Insert → Insert row**
2. `id`: paste the User UID from step 3
3. `name`: your name
4. `role`: `admin`
5. **Save**

This `profiles` table with Row Level Security is what actually enforces "admin only" —
not the JavaScript. Client-side code can always be edited in a browser's dev tools, so
real authorization has to be checked on Supabase's servers via these policies, not just
hidden in the UI.

### 5. Run it
Open `index.html` (or serve it locally, see below) and sign in with the email/password
you created in step 3. Only accounts with a matching `profiles` row where `role = 'admin'`
will get past the login screen.

## Running locally

No build tools required — it's static HTML/CSS/JS.

```bash
git clone https://github.com/<your-username>/northbound-dashboard.git
cd northbound-dashboard
# then just open index.html in a browser, or serve it locally:
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploying (free, in under 2 minutes)

**Option A — GitHub Pages**
1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Under "Source," select the `main` branch and `/root`
4. Your live link will appear at `https://<username>.github.io/<repo-name>/`

**Option B — Netlify / Vercel**
1. Import the GitHub repo on netlify.com or vercel.com
2. No build command needed (static site) — deploy as-is

## What I'd improve next

- Wire the "+ New project" button to an actual modal/form
- Persist search state and sidebar collapse state
- Add a dark mode toggle using the existing CSS custom properties
- Replace mock data with a small JSON file fetched on load

## License

MIT — feel free to fork and customize.
