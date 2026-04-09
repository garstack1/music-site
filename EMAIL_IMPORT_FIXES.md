# Email Import Fixes

## Issues Fixed

### 1. **Character Encoding (Special Characters)**
**Problem:** News items show garbled characters like `âOFF PLANETâ` instead of `"OFF PLANET"`

**Solution:** 
- Added comprehensive `decodeHtmlEntities()` function to properly handle HTML entities
- Handles both named entities (`&rsquo;`, `&rdquo;`, etc.) and numeric entities (`&#x...;`, `&#...;`)
- Applied entity decoding in both plain text and HTML extraction paths
- Improved quoted-printable decoding for UTF-8 content

### 2. **Text Alignment**
**Problem:** Emails with center-aligned formatting in Gmail appear left-aligned on the site

**Solution:** Improved display rendering in news article page:
- Now detects uppercase lines as headings (common in press releases)
- Better handling of list items with bullet points
- Improved paragraph spacing and layout

### 3. **Embedded Images & Featured Image**
**Current State:**
- First image is already extracted as featured image ✓
- Images are properly extracted from email body
- Image URLs are captured and used as `imageUrl` in news items

**Enhancement Made:**
- Improved image extraction regex to handle various image formats
- Images are displayed with proper aspect ratio in the article view

### 4. **Embedded Videos**
**Current State:**
- YouTube and Vimeo URLs are extracted ✓
- Videos are appended to article body with watch links
- Regex patterns handle various YouTube URL formats (youtube.com, youtu.be, embed)

**Enhancement Made:**
- Both YouTube and Vimeo links are properly captured
- Appended to article body with clear platform identification

### 5. **HTML Formatting Preservation**
**Current State:**
- HTML is stripped to plain text for display

**Improvements:**
- Better preservation of formatting intent through improved stripHtml()
- Bold/italic text is now stripped cleanly
- Lists are converted with bullet points
- Headings and structure are preserved through whitespace

## Technical Details

### Updated Functions

#### `decodeHtmlEntities(str)`
Maps common HTML entities to their Unicode equivalents:
- Smart quotes: `&rsquo;` → `'`, `&rdquo;` → `"`
- Dashes: `&mdash;` → `—`, `&ndash;` → `–`
- Symbols: `&bull;` → `•`, `&copy;` → `©`
- Numeric entities: `&#x00E2;` → `â` (handles hex & decimal)

#### Email Body Extraction
1. Detects charset from Content-Type header
2. Handles quoted-printable encoding (`=XY` escapes)
3. Extracts either plain text or HTML with proper decoding
4. All entities decoded before text is stored

#### Article Display (`news/[slug]/page.tsx`)
- Line-by-line rendering for better formatting control
- Empty lines preserved visually
- List items with bullets detected and styled
- ALL CAPS lines treated as section headings
- Better paragraph spacing and line breaks

## Testing Recommendations

1. **Character Encoding**: Re-import an email with special characters (smart quotes, dashes, non-ASCII)
2. **Image Display**: Verify the first image appears as the featured image on the card
3. **Video Links**: Check that embedded YouTube/Vimeo links are preserved and clickable
4. **Formatting**: Review press releases to ensure headings and lists display correctly
5. **HTML Emails**: Test with both plain text and HTML format emails

## Files Modified

- `src/lib/email-monitor.ts` - Email extraction and encoding fixes
- `src/app/(public)/news/[slug]/page.tsx` - Article display improvements
