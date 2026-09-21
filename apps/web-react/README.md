# Personal-FI Web (React)

## Run locally

```bash
# from repo root
cp docs/core/db/schema.sql apps/web-react/public/schema.sql
cd apps/web-react
npm install
npm run dev
```

Opens RTL Persian shell with six routes. Browser loads sql.js WASM from CDN and persists SQLite bytes in IndexedDB when production host module resolves.

## User journey A

1. Onboarding → create book (immutable `book_id`)
2. Money → create account → deposit (explicit `inflowKind`)
3. Home → cash metric from `money.totals`
4. More → backup sheet (bytes + checksum)

## Host injection (tests)

```js
window.__PF_HOST__ = myHost;
```

## Production honesty

`PRODUCTION=NO-GO` until Playwright E2E green. Modules and UI paths are wired for real use in development.
