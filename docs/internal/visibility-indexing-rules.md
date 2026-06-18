# Visibility and Indexing Rules

This note records the CapturePass indexing strategy for profiles and business pages.

## Visibility Modes

### Public

- `index, follow`
- Eligible for sitemap inclusion only when the page is a stable marketing or directory route
- Used for public individual profiles, public business main profiles, and active visible team member profiles

### Unlisted

- `noindex, nofollow`
- Direct-link only
- Not included in sitemap

### Private

- `noindex, nofollow`
- Not included in sitemap
- Does not expose private profile data publicly

## Route Rules

- Public readable profile routes resolve through page metadata and remain crawlable by default.
- Team member routes only render when the member is active and visible.
- Inactive or hidden team member routes redirect to the main business profile and are not indexed.
- Token-based surfaces such as `/u/`, `/p/`, and `/pass/` are direct-share destinations and stay out of crawler traversal.

## Sitemap Rules

- The sitemap remains marketing-only.
- Dynamic profile pages are intentionally omitted from the sitemap because their visibility depends on runtime state.
- Private, unlisted, inactive, or hidden profile pages must never be added to the sitemap.

## Notes

- Public business profiles default to indexable unless a later visibility control explicitly marks them otherwise.
- This document is informational only and does not change runtime behavior by itself.
