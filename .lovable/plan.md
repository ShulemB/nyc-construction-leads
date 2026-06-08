# Preserve Filings Filters & Add Clear Filters

Move all Filings-list state into URL search params so it persists across navigation (Filings → Filing Detail → back), is bookmarkable/shareable, and supports a clear-all action.

## Scope
Only `src/routes/_authenticated/filings.index.tsx`. No backend or server-fn changes — `listFilings` already accepts these params.

Note: a few requested fields don't exist in the current UI yet (Permit Status, Filing Date range, Page Size selector, Column visibility). Per "only change what was asked," I'll wire up state-preservation + Clear for what's on the page today (search, boroughs, job types, work types, new-only, sort, page) and add the **scroll position** restore. I will NOT invent Permit Status / date-range / column-visibility controls in this pass — flag them as a follow-up if you want them built.

## Changes

### 1. Expand `validateSearch` (Zod) to cover all filter state
Fields stored in URL with `fallback(...)` defaults so empty defaults stay out of the URL:
- `q: string`
- `boroughs: string[]`
- `jobTypes: string[]`
- `workTypes: string[]`
- `newOnly: boolean`
- `sort: "lead_score" | "latest_action_date" | "initial_cost"` (default `lead_score`)
- `page: number` (default 1)

### 2. Replace `useState` with URL-driven reads/writes
- Read: `const search = Route.useSearch();`
- Write: `const navigate = useNavigate({ from: Route.fullPath });` then `navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })`. Use `replace` for keystrokes (search input) to avoid history spam; use push for filter chips / sort / pagination so Back returns to previous filter state.
- Debounce `q` (~250ms) before pushing to URL to avoid a history entry per keystroke.

### 3. Scroll restoration
TanStack Router already restores scroll on back-nav when `scrollRestoration` is enabled on the router. Verify `src/router.tsx` sets `scrollRestoration: true`; if not, enable it. No per-route code needed.

### 4. Active-filter indicator + Clear Filters button
- Compute `activeCount` = boroughs.length + jobTypes.length + workTypes.length + (q ? 1 : 0) + (newOnly ? 1 : 0) + (sort !== "lead_score" ? 1 : 0).
- When `activeCount > 0`, render a toolbar row above the results:
  - Label: `Filters ({activeCount})`
  - Button: **Clear filters** (primary/destructive styling so it stands out) — calls `navigate({ search: {} })` which resets everything to defaults and returns to page 1.
- Add a smaller "Clear all" text-link inside the filter card header (same handler) for quick access.

### 5. Detail page back-link
Filing Detail's back button (if any) should use router back or `<Link to="/filings">` without an explicit empty `search` so existing URL params remain when the user uses browser back. Verify the detail page doesn't force-navigate with `search: {}`.

## Technical notes
- All param updates go through one helper `update(patch)` to keep call sites clean.
- Array params via Zod: `fallback(z.array(z.string()), []).default([])` — empty arrays serialize cleanly.
- Page resets to 1 on any filter/sort/search change inside `update()`.

## Out of scope (call out for follow-up)
- Permit Status filter (no field/UI today)
- Filing Date range picker (no UI today)
- Page-size selector (hardcoded 50)
- Column visibility (list view, no columns to toggle)

Want me to also add those new controls in this pass, or ship state-preservation + Clear Filters first?
