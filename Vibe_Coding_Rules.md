## Reference files (source of truth)
| `Infrastructure_Asset_Inventory_PRD_TRD.md` | **Features, data model, API, business logic.** |

If the two conflict, the UI file wins for looks and the PRD/TRD wins for behavior.

## What to build
A mobile-first web app that tracks infrastructure assets (roads, streetlights, pipelines, bridges, drains, buildings) across their full lifecycle: **Planned → Acquired → Installed → In service → Under maintenance → Decommissioned → Disposed**.

Convert `asset-inventory-ui.html` into a real app. Keep the same screens and components, then wire them to live data.

## Design tokens (do not change)
| Token | Hex | Use |
|-------|-----|-----|
| Deep Bluish | `#0D3A35` | Page background, ring center |
| Moderate Green | `#276152` | Gradient blobs, bar fills, glass fallback |
| Laurel Green | `#B1B7AB` | Secondary accents, roads on map, done steps |
| Light Cream | `#FBF6F0` | Text, primary buttons, active states |

Health colors: healthy `#8FD3B0`, watch `#E6C36A`, high `#E38B5F`, critical `#EF6A62`.

### Glass recipe
```css
background: linear-gradient(145deg, rgba(251,246,240,.14), rgba(251,246,240,.08));
border: 1px solid rgba(251,246,240,.16);
backdrop-filter: blur(22px) saturate(140%);
box-shadow: inset 0 1px 0 rgba(251,246,240,.22), 0 18px 40px -18px rgba(0,0,0,.45);
border-radius: 26px;
```
Glass only reads well over the blurred green gradient blobs on the body, so keep those.

### Typography
Bricolage Grotesque (headings, numbers) and Figtree (body). Sentence case everywhere.

## UI rules
- Glass panels: sidebar, KPI cards, map card, asset detail, work orders, category bars.
- One entrance moment only: KPI count-up. Critical map pins pulse. No other decorative motion.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Visible keyboard focus, `aria-label` on icon buttons, 44px+ touch targets.
- Under 760px, the sidebar becomes a floating bottom navigation bar.
- Button labels stay consistent with their result: "Create work order" shows "Work order created for RD-0117".

## Recommended stack
React + Vite + TypeScript, Tailwind (map tokens above into the theme), React Query, Leaflet with OpenStreetMap (replace the SVG map), Recharts if more charts are needed. Backend: FastAPI + PostgreSQL/PostGIS (or Supabase). See TRD sections 10 to 13.

## Build order
1. Set up the theme (tokens, glass utility class, fonts, background blobs).
2. Recreate the app shell: sidebar, header, search, Add asset button.
3. Dashboard KPIs from `/dashboard/summary`.
4. Map with health-colored markers, category filters, and search, replacing the mock pins.
5. Asset detail panel: health ring, lifecycle stepper, actions.
6. Asset form (GPS auto-fill, photo upload), then inspections and work orders.
7. Role-based login, citizen report page, AI damage detection (see PRD P0 then P1).

## Acceptance checks
- Screens look the same as `asset-inventory-ui.html` at 1440px and 390px widths.
- Clicking a marker updates the detail panel, ring color, and lifecycle stepper.
- Filters and search dim non-matching pins.
- Lighthouse accessibility score of 90 or higher.
- No hard-coded colors outside the token list above.

## Prompt to start with
> Use `asset-inventory-ui.html` as the exact visual reference and `Infrastructure_Asset_Inventory_PRD_TRD.md` as the product spec. Build the P0 features first. Keep the glassmorphism style, the four-color palette, and the layout unchanged. Ask before adding new libraries or changing tokens.
