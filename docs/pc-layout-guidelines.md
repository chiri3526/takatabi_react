# PC Layout Guidelines (Reusable)

## Purpose
Use this guideline to keep desktop readability consistent across pages while preserving the current visual tone (color, radius, font family).

## Breakpoints
- Desktop: `min-width: 1024px`
- Large desktop: `min-width: 1280px`
- Wide desktop: `min-width: 1440px`

## Core Rules
1. Use a centered single main column for text-heavy content.
2. Keep reading width constrained to around 720-780px.
3. Keep section spacing hierarchy consistent:
   - section-to-section spacing: largest
   - heading-to-body spacing: medium
   - paragraph/list spacing: smallest
4. Keep component widths aligned:
   - article title/meta
   - hero image
   - TOC
   - body
   - ad slot
   - related list
5. Keep existing design tokens:
   - `theme.colors`
   - existing font family stack
   - current border-radius direction

## Article Page Specific
1. Preferred order:
   - title/meta
   - hero image
   - table of contents
   - body
   - ad
   - related links
   - back link
2. TOC should support quick scanning and current-section highlighting.
3. Related links should be capped and visually secondary to body content.

## Accessibility
1. Keep sufficient contrast with current tokens.
2. Use semantic landmarks (`article`, `header`, `nav`) where possible.
3. Use `aria-current="location"` for active TOC links.
