# Public Profile Route Rules

This note documents the CapturePass public URL structure added in Phase 6.

## Resolution Order

1. `/{slug}` first checks for an individual public profile.
2. If no individual profile exists, `/{slug}` can resolve to the main public business profile.
3. `/{slug}/{memberSlug}` resolves to a business team member profile.

## Behavior

- Individual profiles keep their existing public profile behavior.
- Main business profiles remain public at the one-segment route.
- Team member routes use the same business profile renderer and contact capture flow.
- Inactive or hidden team members redirect to the business main profile.
- If a team member route cannot be resolved safely, it falls back to the business main profile or 404s when no safe public target exists.

## Data Assumptions

- There is no new database slug column for business team members in this phase.
- Team member aliases are derived from the current member display name.
- The matcher prefers an exact display-name slug and also accepts a first-name slug so URLs like `/richmond-auto/tyler` can resolve even when the stored display name is longer.
- Card reassignment continues to use the existing token and member assignment model.

## Notes

- No TapTagg redirects were added.
- Existing token-based business pass routes remain in place for internal and QR/NFC compatibility.
- This document is informational only and does not change runtime behavior.
