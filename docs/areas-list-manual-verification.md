# Areas list manual verification

The application has no component-test runner, so verify these interactions in an
authenticated session after the backend and frontend are running:

1. With a normal `GET /areas` response, navigate to `/areas` and confirm every
   active Area renders as a row, sorted alphabetically by name, with Name, Key,
   and Created columns populated.
2. Throttle the `GET /areas` request and confirm the page shows a loading
   spinner until the response arrives, without a partial or broken table.
3. Fail `GET /areas` and confirm the page shows an inline red error message
   instead of a table.
4. Return an empty array from `GET /areas` and confirm the page shows a plain
   "No Areas" message instead of a blank table.
5. From the dashboard, click the "Areas" nav button and confirm it navigates
   to `/areas`. From `/properties`, click the "Areas" nav button and confirm
   the same.
6. Without an auth token, navigate directly to `/areas` and confirm you are
   redirected to `/login`, same as the other pages.
