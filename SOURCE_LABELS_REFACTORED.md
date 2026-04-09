# Source Labels - Refactored System

## Overview

Source labels are now managed at the **feed/sender level**, not per-article. This is much cleaner and more maintainable.

---

## How It Works

### RSS Feeds
1. Go to `/admin/feeds`
2. Create new feed (or edit existing)
3. Enter "Source Label" (e.g., "via Pitchfork", "via NME")
4. All articles from this feed automatically get this label
5. Change the label once → affects all future articles from this feed

### Email Senders
1. Go to `/admin/email-monitor`
2. Add new approved sender (or edit existing)
3. Enter "Source Label" (e.g., "Press Release", "Official Statement")
4. All articles from this sender automatically get this label
5. Change the label once → affects all future articles from this sender

### Manual Articles
1. Go to `/admin/news/new`
2. Create article normally (NO source label field here)
3. Manual articles don't have a source label field
4. If you want to add a label, edit the feed/sender that created the article

---

## Admin Interface Locations

### RSS Feeds Admin
**URL**: `/admin/feeds`

**Creating a new feed**:
```
Feed Name:      Pitchfork
Feed URL:       https://pitchfork.com/rss/reviews/albums/
Source Label:   via Pitchfork    ← NEW FIELD
```

### Email Monitor Admin
**URL**: `/admin/email-monitor`

**Adding approved sender**:
```
Name:           PR Team
Email:          pr@example.com
Start Marker:   ===
End Marker:     ******
Source Label:   Press Release    ← NEW FIELD
Gmail Label:    (optional)
Auto-publish:   ☐
```

### News Creation
**URL**: `/admin/news/new`

**Creating article**:
- Title
- Source URL
- Image URL (optional)
- Summary
- Body
- Tags
- Featured checkbox
- ~~Source Label~~ ❌ REMOVED - no longer here!

---

## Display on Public News Page

### Example Card 1 (RSS Article)
```
┌──────────────────────────┐
│   Featured Image         │
│    [via Pitchfork]       │
├──────────────────────────┤
│ Album Review Title       │
│ Summary text...          │
│ [Rock] [Alternative]     │
│ Jan 10, 2026             │
│ Share: 👍 𝕏 💬 🦋         │
└──────────────────────────┘
```

### Example Card 2 (Email Article)
```
┌──────────────────────────┐
│   Featured Image         │
│   [Press Release]        │
├──────────────────────────┤
│ New Product Launch       │
│ Summary text...          │
│ [Product] [News]         │
│ Jan 09, 2026             │
│ Share: 👍 𝕏 💬 🦋         │
└──────────────────────────┘
```

### Example Card 3 (Manual Article)
```
┌──────────────────────────┐
│   Featured Image         │
│                          │  ← No label (manual articles)
├──────────────────────────┤
│ Custom News Item         │
│ Summary text...          │
│ [Custom Tag]             │
│ Jan 08, 2026             │
│ Share: 👍 𝕏 💬 🦋         │
└──────────────────────────┘
```

---

## Default Labels

If you don't enter a custom source label:

| Source Type | Default Label |
|-------------|---------------|
| RSS Feed (Pitchfork) | `"via Pitchfork"` |
| RSS Feed (NME) | `"via NME"` |
| Email (PR Team) | `"PR Team (Email)"` |
| Manual | None (no label shown) |

---

## Database Changes

### Migrations Required
```bash
npx prisma migrate deploy
```

This creates:
- `sourceLabel` field on `RssFeed` table
- `sourceLabel` field on `ApprovedSender` table
- Keeps existing `sourceLabel` on `NewsArticle` (for articles to display)

### Schema
```prisma
model RssFeed {
  id          String
  name        String
  url         String
  sourceLabel String?  // e.g., "via Pitchfork"
  // ... other fields
}

model ApprovedSender {
  id          String
  name        String
  email       String
  sourceLabel String?  // e.g., "Press Release"
  // ... other fields
}

model NewsArticle {
  id          String
  sourceLabel String?  // Auto-populated from feed/sender
  // ... other fields
}
```

---

## Workflow Examples

### Example 1: Add Pitchfork Feed
1. Go to `/admin/feeds`
2. Click "Add Feed" button
3. Fill form:
   - Name: `Pitchfork`
   - URL: `https://pitchfork.com/rss/reviews/albums/`
   - Source Label: `via Pitchfork`
4. Save
5. Next time RSS imports articles, they'll have label "via Pitchfork"

### Example 2: Add PR Company Email
1. Go to `/admin/email-monitor`
2. Click "Add Sender" button
3. Fill form:
   - Name: `Sony Music PR`
   - Email: `press@sonymusic.com`
   - Source Label: `Sony Music Press Release`
4. Save
5. Next time emails arrive from this sender, articles will have label "Sony Music Press Release"

### Example 3: Change a Feed's Label
1. Go to `/admin/feeds`
2. Find the feed
3. Edit it
4. Change Source Label from "via Pitchfork" to "Pitchfork Reviews"
5. Save
6. **Future articles** from this feed will use new label
7. **Past articles** keep their original label (set when imported)

---

## Technical Details

### How Labels Flow

```
User creates feed with sourceLabel
          ↓
Articles imported from feed
          ↓
Each article gets: sourceLabel = feed.sourceLabel || `via ${feed.name}`
          ↓
Display on news page:
  Card shows sourceLabel in bottom-right corner
```

### Code Changes

**RSS Poller** (`src/lib/rss-poller.ts`):
```typescript
sourceLabel: feed.sourceLabel || `via ${feed.name}`
```

**Email Monitor** (`src/lib/email-monitor.ts`):
```typescript
sourceLabel: sender.sourceLabel || `${sender.name} (Email)`
```

**Admin APIs**:
- POST `/api/admin/feeds` accepts `sourceLabel`
- POST `/api/admin/approved-senders` accepts `sourceLabel`

---

## Benefits of This Approach

✅ **Single source of truth** - Each feed/sender has one label  
✅ **Consistency** - All articles from same source have same label  
✅ **Easy to manage** - Change label once, affects all future articles  
✅ **Cleaner UIs** - No source label field cluttering article creation forms  
✅ **Scalable** - Add hundreds of feeds without complexity  
✅ **Maintainable** - Easier to understand and modify in future  

---

## Migration from Old System

If you had articles with custom source labels from before:

1. Old sourceLabel field on NewsArticle still exists
2. Articles won't show old label unless it's copied to feed/sender level
3. New articles will use feed/sender's sourceLabel
4. You can manually clean up old data if needed

---

## FAQ

**Q: Can I change a feed's label?**  
A: Yes! Edit the feed, change the label. Future articles use new label. Past articles keep their original label.

**Q: Can I have different labels for same feed?**  
A: No, not directly. You'd create separate feed entries (one for each label).

**Q: Can manual articles have custom labels?**  
A: Currently no - manual articles don't have source labels. You could add one by editing the article to add a custom label field if needed.

**Q: Where do I see articles imported from a feed?**  
A: Go to `/admin/news` - each article shows its source feed/sender in the list.

**Q: What if I don't set a source label?**  
A: Auto-generated defaults are used:
- RSS: "via {Feed Name}"
- Email: "{Sender Name} (Email)"

---

## Setup Instructions

### Step 1: Pull Latest Code
```bash
git pull origin main
```

### Step 2: Run Migration
```bash
npx prisma migrate deploy
```

### Step 3: Test

**Add RSS Feed with Label**:
1. Go to `/admin/feeds`
2. Create new feed
3. Enter custom "Source Label"
4. Manually trigger import
5. Check `/news` - new articles should show label

**Add Email Sender with Label**:
1. Go to `/admin/email-monitor`
2. Add new sender
3. Enter custom "Source Label"
4. Send test email
5. Check `/admin/import-email` to trigger import
6. Check `/news` - articles should show label

---

**Version**: 2.0 (Refactored)  
**Status**: ✅ Ready to Deploy  
**Last Update**: April 10, 2026
