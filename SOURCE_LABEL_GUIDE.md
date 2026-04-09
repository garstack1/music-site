# News Features Implementation Guide

## What's New

### 1. **Share Buttons** ✅
- Fixed WhatsApp, Facebook, X, and Bluesky share buttons
- Each button properly encodes and sends article title + URL
- Displays on every news card

### 2. **Source Label Customization** ✅
- Add custom source labels to news articles
- Displays on bottom-right corner of news cards (dark badge)
- Auto-generates labels based on source type:
  - **RSS Feeds**: `"via NME"`, `"via Pitchfork"`, etc.
  - **Email Imports**: `"Sender Name (Email)"`
  - **Manual Articles**: `"Manual"` (unless you set a custom label)

### 3. **Admin UI Updates** ✅
- New "Source Label" field in:
  - `/admin/news/new` - create new articles
  - `/admin/news/[id]/edit` - edit existing articles
- Optional field - leave blank for auto-generated labels
- Examples provided in placeholder text

## Setup Instructions

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Run Database Migration
The migration adds the `sourceLabel` field to the NewsArticle table:

```bash
npx prisma migrate deploy
```

If that doesn't work, manually run the SQL:
```sql
ALTER TABLE "NewsArticle" ADD COLUMN "sourceLabel" TEXT;
```

### Step 3: Test the Features

#### Test Share Buttons:
1. Go to any news article
2. Click WhatsApp, Facebook, X, or Bluesky icons
3. Should open share dialog with article title and URL

#### Test Source Labels:
1. Go to `/admin/news/new`
2. Create a new article
3. Fill in "Source Label" field (e.g., "Press Release", "Official Announcement")
4. Save and view on public news page
5. Label appears on bottom-right of card

#### Edit Existing Articles:
1. Go to `/admin/news`
2. Click edit on any article
3. Add/modify "Source Label" if desired
4. Save changes

## How Source Labels Work

### Auto-Generated (No Input Needed)
- **RSS Articles**: Automatically use `"via {Feed Name}"`
- **Email Articles**: Automatically use `"{Sender Name} (Email)"`
- New articles created via API will use these defaults

### Custom Labels
- Create or edit any article
- Enter custom text in "Source Label" field
- Examples: "Press Release", "Official Statement", "Email Submission", "Third Party"
- Leave blank to use auto-generated label

### Display
- Shows on bottom-right of news card
- Dark background (black/70% opacity) with white text
- Positioned over the featured image
- Only shows if label exists

## Database Changes

### NewsArticle Table
Added field:
```
sourceLabel TEXT? (nullable)
```

**Migration file**: `prisma/migrations/add_source_label/migration.sql`

## API Changes

### POST /api/admin/news (Create)
Now accepts optional `sourceLabel`:
```json
{
  "title": "Article Title",
  "summary": "...",
  "body": "...",
  "sourceUrl": "https://...",
  "sourceLabel": "via NME",
  "imageUrl": "https://...",
  "featured": false,
  "genreIds": ["genre-id"]
}
```

### PATCH /api/admin/news/[id] (Edit)
Now accepts `sourceLabel` in update:
```json
{
  "sourceLabel": "Press Release"
}
```

## Components Updated

### Public News Page
- `src/app/(public)/news/page.tsx`
  - Fixed share button URL encoding
  - Updated NewsCard to display sourceLabel badge
  - Display logic:
    1. Use custom sourceLabel if set
    2. Fall back to `"via {RSS Feed Name}"` if from RSS
    3. Otherwise no label

### Admin News Pages
- `src/app/admin/news/new/page.tsx`
  - Added sourceLabel state
  - Added sourceLabel input field
  - Sends sourceLabel in POST request

- `src/app/admin/news/[id]/edit/page.tsx`
  - Added sourceLabel state
  - Loads sourceLabel from article data
  - Added sourceLabel input field
  - Sends sourceLabel in PATCH request

### Email Monitor
- `src/lib/email-monitor.ts`
  - Sets `sourceLabel` to `"{Sender Name} (Email)"` on creation

### RSS Poller
- `src/lib/rss-poller.ts`
  - Sets `sourceLabel` to `"via {Feed Name}"` on creation

### Admin API
- `src/app/api/admin/news/route.ts`
  - POST now accepts and saves `sourceLabel`
  - GET returns articles with sourceLabel

## File Changes Summary

```
Modified:
- src/app/(public)/news/page.tsx (share buttons, card display)
- src/app/api/admin/news/route.ts (POST handler)
- src/app/admin/news/new/page.tsx (add form field)
- src/app/admin/news/[id]/edit/page.tsx (add form field)
- src/lib/email-monitor.ts (auto-set label)
- src/lib/rss-poller.ts (auto-set label)
- prisma/schema.prisma (add sourceLabel field)

Created:
- prisma/migrations/add_source_label/migration.sql
```

## Next Steps (Optional)

### For Events & Reviews
You can apply the same pattern to events and reviews:
1. Add `sourceLabel` field to EventTag and ReviewTag tables
2. Add UI fields in admin create/edit pages
3. Display labels on event/review cards

### For RSS Feed Names
If you want to customize RSS feed display names:
1. Edit `/admin/feeds` page
2. Add custom label field to RssFeed model
3. Use custom label instead of feed.name in email-monitor.ts and rss-poller.ts

## Troubleshooting

### Source Label Not Showing
1. Check if the article has a sourceLabel value in the database
2. Verify the sourceLabel field was added: `ALTER TABLE NewsArticle ADD COLUMN sourceLabel TEXT;`
3. Clear browser cache

### Share Buttons Open Wrong URL
1. Verify the article slug is correct
2. Check browser console for URL encoding errors
3. Test with a simple article title (no special characters)

### Migration Fails
- If `npx prisma migrate deploy` fails, check:
  1. Database connection is working
  2. No existing `sourceLabel` column (migration won't run twice)
  3. Database user has ALTER TABLE permissions

## Questions?

Refer to the commit history for implementation details:
- `414ec1c` - Source label customization and share button fixes
- `04227c9` - Admin UI updates for sourceLabel field
