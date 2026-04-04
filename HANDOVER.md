# Music Site - Handover Document

## Project Overview
A music news aggregation, event discovery & concert review website built as a solo passion project.

## Tech Stack
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Database**: PostgreSQL 16 (`musicsite_db`, user: `musicsite`)
- **ORM**: Prisma 7.6.0 (uses `@prisma/adapter-pg` with `pg` pool — NOT the old `datasourceUrl` pattern)
- **Styling**: Tailwind CSS with custom color scheme
- **Auth**: Not yet implemented (next step)
- **Repo**: github.com/garstack1/music-site (private)
- **Location**: ~/music-site on WSL2 Ubuntu

## Color Scheme
- Dark areas (header, hero, footer, admin): #0D0D0D bg, #1A1A1A surface, #262626 cards
- Light areas (content): #FFFFFF bg, #F5F5F5 surface
- Accent: Crimson #DC2626 (hover: #B91C1C)
- Hybrid layout: dark header/hero → light content areas

## Database (Prisma 7 specifics)
- `prisma.config.ts` handles the DB URL via dotenv + `datasource.url` and `migrate.url`
- PrismaClient requires `@prisma/adapter-pg` with a `pg.Pool` — see `src/lib/db.ts`
- Schema in `prisma/schema.prisma` — datasource block has NO url (handled by config)
- Tables: User, RssFeed, NewsArticle, ArticleTag, Event, Review, ReviewPhoto, PublicReview, Genre, SiteSetting

## Seed Data Present
- 18 genres
- Admin user: garstack@gmail.com / admin123
- 3 RSS feeds (Pitchfork, NME, RTÉ)
- 5 sample news articles (2 featured)
- 7 events (4 concerts IE/UK, 3 festivals IE/ES/UK)
- 3 concert reviews (Fontaines D.C., Lankum, Murder Capital)
- 6 site settings

## What's Built
### Public Pages
- **Layout**: Dark header (MUSICSITE logo + nav), dark footer, responsive
- **Homepage** (`/`): Hero with featured article, latest news grid, upcoming events cards, concert reviews section
- **News** (`/news`): Featured articles + chronological listing with genre tags
- **News Detail** (`/news/[slug]`): Article with image, summary, body, source link
- **Events** (`/events`): Festivals section (cards) + Concerts section (list with date blocks + ticket buttons)
- **Reviews** (`/reviews`): Card grid with photo placeholder, user score badges
- **Review Detail** (`/reviews/[slug]`): Hero with details, photo gallery grid, body text, setlist, user reviews section

### Admin Pages
- **Admin Layout** (`/admin`): Dark theme, separate nav (Dashboard, News, Events, Reviews, RSS Feeds, Moderation), logout button
- **Dashboard** (`/admin`): 6 stat cards, quick action buttons (new article/event/review), 3 recent activity panels

## What Needs Building Next (Phase 3 continues)
### Admin Auth (Priority)
- Login page at `/admin/login`
- Middleware to protect `/admin/*` routes
- Session management (consider simple JWT or NextAuth)

### Admin CRUD Pages
- **RSS Feeds** (`/admin/feeds`): List feeds, add/remove/toggle active, test feed
- **News** (`/admin/news`): List articles, create/edit manual articles, feature/unfeature, manage tags
- **Events** (`/admin/events`): List events, create/edit manual events, CSV upload
- **Reviews** (`/admin/reviews`): List reviews, create/edit with rich text, photo upload, draft/publish
- **Moderation** (`/admin/moderation`): Review flagged public reviews, approve/reject

### API Routes Needed
- `/api/auth/*` — login, logout, session check
- `/api/admin/feeds` — CRUD for RSS feeds
- `/api/admin/news` — CRUD for articles
- `/api/admin/events` — CRUD for events + CSV upload
- `/api/admin/reviews` — CRUD for reviews + photo upload
- `/api/admin/moderation` — approve/reject public reviews

## Phase 4 (After Admin)
- RSS feed polling (cron job)
- Ticketmaster API integration with affiliate links
- Google Drive CSV sync for event organisers
- Profanity filter for public reviews
- Search page with full-text search
- Event calendar view + map view
- Ad space placeholders

## Key Requirements Recap
- **News**: RSS aggregation (curated feeds) + manual articles. Admin can feature/pin, auto-categorise with tags
- **Events**: Ticketmaster auto-publish (IE+UK concerts, EU festivals), CSV via Google Drive auto-publish (revocable), manual add. Deduplication via fingerprint (normalised artist+venue+city+date). Ticketmaster data wins on merge. Affiliate links on ticket buttons
- **Reviews**: Admin writes structured reviews (artist, venue, date, setlist, photos, body). No admin score. Public can rate 0-10 with text (word limit, profanity filter, English dictionary check)
- **Monetisation**: Ticketmaster affiliates, Eventbrite affiliates, Google Ads space
- **Events browsing**: List, calendar, and map views. Filter by genre, city, date, country (festivals)

## Important Technical Notes
- Heredocs with `<< 'EOF'` strip `<a` tags — watch for broken anchor tags in JSX
- Prisma 7 is very different from Prisma 5/6 — always use the adapter pattern
- Node.js v20.20.2 (Prisma warns about needing 22+ but works fine)
- Existing project `shotspot` at ~/shotspot with `shotspot_db` — keep separate
