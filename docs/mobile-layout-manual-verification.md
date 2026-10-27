# Mobile layout — manual verification

This repo has no component-test runner, so the mobile layout is verified by hand.

**Setup:** run `npm run dev` (port 3010) and log in. Use browser dev tools (or the in-app browser) at **375×812** (phone) and **768×1024** (tablet). The phone layout applies below MUI's `sm` breakpoint (600px).

**Done means:** no horizontal _page_ scroll at 360px, and interactive controls outside data tables are at least 44px.
Check with `document.documentElement.scrollWidth === document.documentElement.clientWidth` in the console.

## Phone (≤ 599px)

### Navigation
- [ ] A fixed bottom tab bar shows Dashboard, Properties, Areas, Settings; the current page is highlighted green.
- [ ] The top bar shows only the logo, "Listings Monitor" and an icon-only Logout button (44px).
- [ ] The text nav links are not visible in the top bar.
- [ ] The last item on every page is not hidden behind the bottom bar.
- [ ] On an iPhone with a home indicator, the bar is padded above the indicator (`viewport-fit=cover` + `env(safe-area-inset-bottom)`).
- [ ] `/login` has no bottom bar and no extra blank space at the bottom.

### Properties (`/properties`)
- [ ] The filter bar is collapsed to a single **Filters** button with a count badge of active filters.
- [ ] A **Clear** button appears next to it only when filters are active.
- [ ] Tapping **Filters** opens a bottom sheet with: First-seen presets, From/To date pickers, Property type, Area, Source, Furnished, Unseen / Bookmarked / Price changed, and the Needs-review chips.
- [ ] Changes in the sheet do **not** reload the list until **Apply** is tapped; closing the sheet without Apply discards them.
- [ ] **Reset** clears every control in the sheet (still needs Apply to take effect).
- [ ] The list is a table that scrolls horizontally inside its card; the page itself does not scroll sideways.
- [ ] Pagination shows the range ("1–10 of 30") and prev/next arrows only; no rows-per-page selector; arrows are 44px.
- [ ] Price-position and repost chip links have a 44px tap area.

### Dashboard (`/`)
- [ ] Metric card and EUR/USD card stack in one column.
- [ ] The two currency tiles share the row; the Today / Yesterday / Weekly toggle is full width and 44px tall.
- [ ] The rate chart is readable (axis labels not clipped).
- [ ] The area pie is ~300px tall and its legend rows are 44px.
- [ ] The From/To date pickers stack full width.
- [ ] The New-properties bar chart shows short labels ("30 Jun") that do not overlap; tooltips and aria-labels still use the full date + weekday.
- [ ] Property tables scroll sideways inside their cards.

### Other pages
- [ ] `/areas`: table scrolls sideways inside its card; Add Area and Run now buttons are 44px.
- [ ] `/providers/<id>`: header buttons wrap; table scrolls sideways; pagination simplified.
- [ ] `/settings`: single column; Save button is full width and 44px.
- [ ] `/login`: card fits at 360px with the keyboard closed.
- [ ] Edit Property dialog opens full screen; Save/Cancel stay reachable and the form scrolls.

## Tablet (≥ 600px, e.g. 768px)
- [ ] The desktop header with text nav and text Logout button is shown; no bottom bar; no extra bottom padding.
- [ ] The Properties filter bar is the inline desktop version; the Filters button/sheet is not shown.
- [ ] The Edit Property dialog is a normal centered dialog.

## Known limitations
- Dark mode is out of scope: `globals.css` flips the page colors under `prefers-color-scheme: dark` but components hardcode light colors, so a phone in dark mode may render oddly.
- Table rows keep their desktop-sized icon buttons (≈34px) because tables scroll rather than reflow.
- The provider page (`/providers/<id>`) uses its own header and has no bottom tab bar.
