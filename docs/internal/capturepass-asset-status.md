# CapturePass Asset Status

## Current State

- App icons and Apple touch icons now use the centralized CapturePass PNG art from `public/brand/`.
- The shared brand mark still exists for internal/generated use, but the visible brand surfaces now use the approved PNG files.
- Open Graph and Twitter image routes now use the CapturePass brand files from `public/brand/`.
- The old static TapTagg logo card was removed from `public`.
- Final brand artwork should live in one place: `public/brand/`.

## Remaining Work

- Replace placeholder generated art with final logo files when the approved artwork is ready.
- Add any future marketing screenshots, email hero assets, or product mockups to the CapturePass asset set.
- If a final vector logo is selected later, swap the generated icon routes to the new source without changing the metadata paths.

## Central Asset Map

Keep all brand files together under `public/brand/` and refer to them from the centralized asset map in `lib/brand-assets.ts`.

Current files:

- `public/brand/CapturePass Logo.png`
- `public/brand/CapturePass Wordmark.png`
- `public/brand/Capturepass Logo with Wordmark.png`
- `public/brand/Capturepass Logo with Wordmark and Tagline.png`

If you add one-off launch or campaign assets later, keep them in `public/brand/` as well rather than creating new scattered asset locations.
