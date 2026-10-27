# Properties Search — manual verification

This repo has no component-test runner, so Search is verified by hand.

**Setup:** confirm nothing stale is listening on 3009 / 3010 (`lsof -iTCP:3009 -iTCP:3010 -sTCP:LISTEN`), then start the backend (`npm run start:dev`, port 3009) and the frontend (`npm run dev`, port 3010). The backend's database must have the `unaccent` extension (`docs/migrate-enable-unaccent-extension.sql` in the backend repo). Log in, open `/properties`, and watch the Network tab for `GET /properties?...`.

Last run: 2026-10-27, fresh servers, backend against the droplet database.

## Behaviour

- [x] Typing `celesi` quickly (6 keystrokes) sends **one** request, about 400 ms after the last key, with `search=celesi`.
- [x] The result is the single listing "…THREE GARDENS, QERRET" (its text says "Çelësi"); the pager reads "1–1 of 1".
- [x] Typing `ndertese` (phone width) returns listings whose text says "ndërtese"/"ndërtesë"; the API returns the same 547 listings for `ndertese` and `ndërtesë`.
- [x] Symbols are literal: `100%` against the API (not typed in the browser) returns 76 listings rather than everything, so `%` is not acting as a wildcard.
- [x] Typing `BLLOKU  Ballkon ` (upper case, double space, trailing space) sends one request with the trimmed text; the trailing space alone does not trigger another request. Results contain both words in any order.
- [x] From page 2 of the unfiltered list, typing a search sends the request with `page=1` and the URL stays `?page=0`: the table returns to the first page.
- [x] With **Price changed** active, the search request carries `onlyPriceChanged=true` and `search=…`; the pager shows "1–5 of 5".
- [x] A search with no matches (`zzzqqqxx`) shows the table's empty state and "0–0 of 0".
- [x] The clear (×) button empties the box and restores the full list; the box shows × only when it has text.
- [x] **Clear filters** empties the box and switches off the active chips in one go; the link disappears afterwards.
- [x] A box holding only spaces sends no `search` parameter and does not show **Clear filters**.
- [x] A non-empty search shows **Clear filters** (desktop) / **Clear** and counts in the Filters badge (mobile).
- [x] After a reload the box is empty, `localStorage` has no search key (keys: propertyTypes, sources, rowsPerPage, toDate, furnished, areaIds, fromDate), and the URL carries no search.
- [x] Arriving from a chart link (`/properties?areaId=1`) applies the area filter and leaves the box empty.
- [x] Console shows no errors.

## Phone (375×812)

- [x] The search box is full width on its own row directly above the **Filters** button and **Clear**; it is visible without opening the sheet.
- [x] Search box, × button and Filters button are all 44px tall/wide; no horizontal page scroll (`scrollWidth === clientWidth`).
- [x] Side by side on one row the box was only ~46px wide once the 44px × appeared, so the layout was changed to stacked.

## Not checked

- Search failing loudly when the `unaccent` extension is missing (needs a database without it).
- `2_1` and `\\` were only covered by the backend unit tests, not run against the database.
- The `unaccent` migration was run twice against the droplet database (no local Postgres was available), not a local one.
