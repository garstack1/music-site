# NightHawks Brand Guidelines

## Brand Name
**NightHawks** (one word, capital N and H)

## Tagline
"Your guide to live music"

## Logo Versions

| File | Use Case |
|------|----------|
| `logo-full.svg` | Light backgrounds (website header, documents) |
| `logo-full-dark.svg` | Dark backgrounds (dark mode header, footer) |
| `logo-icon.svg` | Icon only, when space is limited |
| `favicon.svg` | Browser favicon |
| `apple-touch-icon.svg` | iOS home screen icon |
| `og-image.svg` | Social media sharing preview |

## Colors

### Primary Brand Color
- **Red**: `#DC2626` (rgb: 220, 38, 38)
- Used for: Logo accent, buttons, links, highlights

### Dark Theme
- **Background**: `#0a0a0a`
- **Surface**: `#141414`
- **Text**: `#f5f5f5`
- **Muted text**: `#888888`
- **Border**: `#262626`

### Light Theme
- **Background**: `#ffffff`
- **Surface**: `#f5f5f5`
- **Text**: `#1a1a1a`
- **Muted text**: `#666666`
- **Border**: `#e5e5e5`

## Typography
- **Primary font**: System UI stack (`system-ui, -apple-system, sans-serif`)
- **Logo text**: Weight 500 (medium)
- **Body text**: Weight 400 (regular)

## Logo Clear Space
Always maintain clear space around the logo equal to the height of the crescent moon icon.

## Minimum Sizes
- Full logo: 140px wide minimum
- Icon only: 24px minimum
- Favicon: 16px (designed for this size)

## Social Media Handles (to reserve)
- Instagram: @nighthawksirl
- X/Twitter: @nighthawksirl
- Bluesky: @nighthawksirl.bsky.social
- TikTok: @nighthawksirl
- Facebook: /nighthawksirl

## Domain Options
- nighthawks.ie (preferred)
- nighthawks.com
- nighthawksmusic.com
- nighthawkslive.com

---

## Activation Checklist

When ready to rebrand from "MUSICSITE" to "NIGHTHAWKS":

- [ ] Purchase domain
- [ ] Set up domain email (hello@nighthawks.ie)
- [ ] Reserve social media handles
- [ ] Update `src/components/layout/Header.tsx` - replace logo
- [ ] Update `src/components/layout/Footer.tsx` - replace logo and social links
- [ ] Update `src/app/(public)/about/page.tsx` - update social links
- [ ] Replace `public/favicon.ico` with new favicon
- [ ] Add `public/apple-touch-icon.png` (convert from SVG)
- [ ] Update `src/app/layout.tsx` - meta title, description, OG image
- [ ] Update Vercel environment variables if needed
- [ ] Update Resend EMAIL_FROM once domain is verified
