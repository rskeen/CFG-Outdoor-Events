# CFG Outdoor Events

A full-stack PWA for tracking outdoor endurance races across the Southeast US with GroupMe integration, automated scraping, and community sign-up.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Database | Supabase (Postgres + Auth + RLS) |
| Hosting | Vercel |
| Scraper | Python service on Railway |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Notifications | GroupMe Bot API |
| AI | Anthropic Claude (claude-sonnet-4-20250514) |
| Scheduling | Vercel Cron + Railway Cron |

## Local Setup

```bash
git clone <repo-url>
npm install
cp .env.local.example .env.local
# fill in .env.local values
npm run dev
```

## Supabase Setup

1. Create a project at supabase.com
2. Copy Project URL, anon key, and service role key into `.env.local`
3. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
4. Enable Google OAuth in Authentication > Providers
5. Add redirect URIs: `http://localhost:3000/auth/callback` and your production URL

### Promote first admin

```sql
UPDATE profiles SET role = 'admin' WHERE id = '<your-user-id>';
```

## GroupMe Bot Setup

1. Go to dev.groupme.com/bots and create a bot for your group
2. Copy the Bot ID into `.env.local` as `GROUPME_BOT_ID`
3. Test from `/admin/groupme` > Send Test Post

## Adding a Scraper Source (Admin UI)

1. `/admin/sources` > Add New Source
2. Paste the race calendar URL
3. Click Analyze with Claude — Claude suggests field mappings
4. Review/edit the config, run a test scrape, then save

## Railway Scraper Deployment

1. Create a Railway project, connect the repo, set root directory to `scraper/`
2. Add env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
3. The `railway.toml` schedules runs on the 1st and 15th of each month at 8am UTC

## Vercel Deployment Checklist

- [ ] Connect GitHub repo to Vercel
- [ ] Add all env vars from `.env.local.example`
- [ ] Set `NEXT_PUBLIC_APP_URL` to your production URL
- [ ] Set `CRON_SECRET` for cron job authentication
- [ ] Add production URL to Supabase Auth redirect URLs
- [ ] Add production URL to Google OAuth authorized redirect URIs

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `GROUPME_BOT_ID` | Yes | GroupMe bot ID |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL |
| `GOOGLE_MAPS_API_KEY` | Optional | For map embeds |
| `RAILWAY_SCRAPER_URL` | Optional | Scraper service URL |
| `CRON_SECRET` | Yes (prod) | Bearer token for cron auth |
