# Nyarindo Shared Asset Manifest

This manifest covers the four applications in the paired Nyarindo development
runtime:

- `portfolio-website`
- `drift`
- `memory-app`
- `semantic-field-extension`

## Optimization result

- Original active media payload: approximately 24.72 MB
- Logical active media count: 38 assets
- Delivery formats: each of the 25 raster assets has an AVIF primary file and
  a WebP fallback; the other 9 assets are SVG vectors
- AVIF set: 4,793,576 bytes
- WebP fallback set: 6,810,728 bytes
- Current formats: 25 AVIF, 25 WebP, 10 SVG, and 3 PNG favicon files
- Files stored for all 38 logical assets: 63
- Self-hosted typography: 9 WOFF2 files, 202,604 bytes
- Broken asset requests after the HD rebuild: 0

Original raster files and the superseded montage are retained outside the public
asset tree at:

`C:\Users\newbon\Documents\Codex\2026-10-29\he\work\asset-optimization-backup-20261030`

## Conversion policy

- Text-heavy and detailed illustrations remain raster because tracing them to SVG
  would change their content, texture, or depth. They use AVIF first with WebP
  as a compatibility fallback.
- Native SVG line art and diagrams remain vector, with XML comments and
  inter-element whitespace removed.
- Images displayed at two substantially different sizes use separate thumbnail
  and full-resolution files.
- The thumbnail loads in the gallery; the full file is requested only for the
  reading stage, zoom viewer, or book dialog.
- Original portraits were resized to their highest useful display density rather
  than shipping unused camera resolution.
- Viewport-critical images use async decoding; off-screen images retain native
  lazy loading.
- No image is embedded as base64 in HTML, CSS, or JavaScript.
- The required font families are self-hosted. Public pages make no Google Fonts
  or other third-party typography requests.

## Shared typography assets

- `fonts/dm-mono-400.woff2`
- `fonts/dm-mono-500.woff2`
- `fonts/dm-sans-var.woff2`
- `fonts/manrope-var.woff2`
- `fonts/ibm-plex-mono-300.woff2`
- `fonts/ibm-plex-mono-300-italic.woff2`
- `fonts/ibm-plex-mono-400.woff2`
- `fonts/ibm-plex-mono-500.woff2`
- `fonts/ibm-plex-sans-var.woff2`
- `fonts/FONT-NOTICES.md`

The font files are loaded by `portfolio-website/local-fonts.css` with
`font-display: swap` and a one-year immutable cache policy in `_headers`.

## Shared application assets

### Drift

- `back-home-arrow.svg`
- `drift-app-icon.svg`

### Return

- `return-spiral-mark.svg`
- `return-wordmark-spiral.svg`

### Semantic Field

- `story-divider-field-constellation.svg`
- `story-divider-pulse-orbit.svg`
- `story-divider-return-arc.svg`

## Portfolio identity assets

- `newbon-nyarindo-gadson-brand-portrait.avif/.webp` — 600 × 800
- `newbon-nyarindo-gadson-portrait.avif/.webp` — 674 × 1600
- `newbon-nyarindo-gadson-whimsy-portrait.avif/.webp` — 640 × 768
- `avatar-smile.webp` — 256 × 256 face-focused crop
- `avatar-laugh.webp` — 256 × 256 face-focused crop
- `avatar-wave.webp` — 256 × 256 smiling frame used with the animated waving-hand overlay
- `avatar-peek.webp` — 256 × 256 close crop for the peeking state
- `avatar-lookaway.webp` — 256 × 256 mirrored crop for the alternate-heading state

The five small WebP portrait crops are deterministic derivatives of the three authored
portraits above. They are loaded only by the navigation-avatar animation and do not replace
the source portraits.
- `universal-coherence-protocol.avif/.webp` — 1460 × 1460, transparent
- `depth-ribbons.svg` — responsive luminous depth artwork
- `favicon-32.png` — browser-tab icon using the support portrait and green ring
- `favicon-192.png` — larger browser and device icon
- `apple-touch-icon.png` — 180 × 180 Touch icon

## Portfolio book assets

Each book has a `-thumb.webp` for the shelf and a `-full.webp` for the reading
stage and detail view.

- `books/the-nyarindo-lens-book-01-grammar-of-pulse-thumb.webp`
- `books/the-nyarindo-lens-book-01-grammar-of-pulse-full.webp`
- `books/nyarindo-lens-book-02-the-pulse-reports-thumb.webp`
- `books/nyarindo-lens-book-02-the-pulse-reports-full.webp`
- `books/nyarindo-lens-book-03-stories-we-tell-about-the-pulse-thumb.webp`
- `books/nyarindo-lens-book-03-stories-we-tell-about-the-pulse-full.webp`
- `books/nyarindo-lens-book-04-the-method-in-the-waves-thumb.webp`
- `books/nyarindo-lens-book-04-the-method-in-the-waves-full.webp`
- `books/nyarindo-lens-book-05-attention-thumb.webp`
- `books/nyarindo-lens-book-05-attention-full.webp`
- `books/nyarindo-lens-book-06-teaching-the-wave-mind-thumb.webp`
- `books/nyarindo-lens-book-06-teaching-the-wave-mind-full.webp`
- `books/nyarindo-lens-book-07-the-vacuum-experiment-thumb.webp`
- `books/nyarindo-lens-book-07-the-vacuum-experiment-full.webp`
- `books/nyarindo-lens-collection-cover-spiral-of-reach-and-return.webp`

The seven thumbnails are 480 × 647. Full book covers are 880 × 1187.

## Portfolio theory artwork

- `a-legion-wearing-one-face/a-legion-01-surface-portrait.avif/.webp` — 1023 × 1537
- `a-legion-wearing-one-face/a-legion-02-archetypes.avif/.webp` — 1254 × 1254
- `a-legion-wearing-one-face/a-legion-03-the-meeting.avif/.webp` — 1080 × 720
- `a-legion-wearing-one-face/a-legion-04-spiral-called-a-meeting.avif/.webp` — 1536 × 1024
- `a-legion-wearing-one-face/a-legion-05-final-act.avif/.webp` — 1536 × 1024
- `the-aperture/the-aperture-key-art.avif/.webp` — 1599 × 1066
- `lens-of-everything-serenity.svg`
- `landscapes/playem-landscape.svg`

## Naming rules

- File names are lowercase, descriptive, and hyphenated.
- Structural variants use `-thumb` and `-full`.
- Raster assets use `.avif` as the preferred delivery and `.webp` as fallback.
- Editable or resolution-independent artwork uses `.svg`.
- Project-specific illustration sets use their own named subdirectory.
