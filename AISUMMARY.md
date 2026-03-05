# AI System Summary (WB Monitoring)

Last scanned: March 5, 2026

## 1) Repository Snapshot
- Monorepo with:
  - `backend/`: Express 5 API (ESM) + Prisma (MySQL) + MSSQL client.
  - `frontend/`: React 18 + Vite 7 + Tailwind.
  - root deployment artifacts: `index.html` and `assets/*` (built frontend output).
- Git status at scan time had local modifications/untracked build outputs (`assets/`, `frontend/dist/`).

## 2) Runtime Architecture
- Frontend talks to backend REST API under `/api`.
- Backend uses two data stores:
  - MySQL (Prisma): users, roles, permissions, items, refresh tokens.
  - MSSQL (`WB_IN`, `WB_OUT`): weighbridge operational workflows.
- Auth model:
  - Access token (JWT, 15m) in memory.
  - Refresh token (JWT, 7d) in `httpOnly` cookie, token hash stored in `RefreshToken` table.
  - Refresh endpoint rotates token and revokes previous hash.

## 3) Backend Implementation
### Entry and middleware
- Active entry: `backend/src/index.js` -> `backend/src/app.js`.
- CORS allowlist from `FRONTEND_URLS` or `FRONTEND_URL`.
- Global middleware: `express.json()`, `cookie-parser`, centralized error handler.
- Auth rate limiting on register/login/forgot/reset password.

### Route map
- `POST /api/auth/register|login|refresh|logout|forgot-password|reset-password/:token`
- `GET /api/users/profile`
- `GET/POST /api/users`, `GET /api/users/roles`, `GET/PUT/DELETE /api/users/:id`
- `GET/POST/PUT/DELETE /api/items...`
- MSSQL workflow routes:
  - `/api/ffb-reupload/*`
  - `/api/split-so/*`
  - `/api/cp-update/*`
  - `/api/barge-update/*`
- `POST /api/sqlexecute` only when `ENABLE_SQL_EXECUTOR=true`, otherwise forced 403.

### Permissions (Prisma enum)
- `CREATE_USER`, `READ_USERS`, `UPDATE_USER`, `DELETE_USER`, `READ_PROFILE`
- `CREATE_ITEM`, `READ_ITEMS`, `UPDATE_ITEM`, `DELETE_ITEM`
- `WB_FFB_REUPLOAD`, `WB_SPLIT_SO`, `WB_CP_UPDATE`, `WB_BARGE_UPDATE`, `WB_SQL_EXECUTE`

### MSSQL workflow behavior
- FFB Reupload: search `WB_IN`; bulk set `ZSAPFLAG='N'`.
- Split SO: query by `MWERKS/date/ticket`; amend `VBELN_1/POSNR_1`, clear split fields, reset `ZSAPFLAG`.
- Car Plate Update: transactional updates across `WB_OUT` and `WB_IN`, resets `ZSAPFLAG`.
- Barge Update: read/update `GROSS_QTY`, `NETBG_QTY`, reset `ZSAPFLAG`.
- SQL Executor: single-statement `SELECT` only; blocks non-SELECT and multi-statement queries.

## 4) Frontend Implementation
### Auth/session
- `AuthProvider` stores `{ user, accessToken }` in React state.
- `PersistLogin` calls `/auth/refresh` on app load if no access token.
- `useAxiosPrivate` injects bearer token and retries once on 403 via refresh.

### Route protection
- Public: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/unauthorized`
- Protected: `/`, `/dashboard`, `/items`, `/items/:id`
- Role-gated: `/admin`, `/admin/users/:id/edit` (ADMIN)
- Permission-gated:
  - `/ffbreupload` (`WB_FFB_REUPLOAD`)
  - `/splitso` (`WB_SPLIT_SO`)
  - `/cpupdate` (`WB_CP_UPDATE`)
  - `/barge` (`WB_BARGE_UPDATE`)
  - `/sqlexecute` (`WB_SQL_EXECUTE`)

### UI modules
- User management, item management (search/pagination/modals), and 4 WB workflows.
- SQL executor page is also frontend-flagged by `VITE_ENABLE_SQL_EXECUTOR`.

## 5) Database Model (Prisma)
- Core tables: `User`, `Role`, `Permission`, `RolePermission`, `Item`, `RefreshToken`.
- Password reset fields are on `User` (`passwordResetToken`, `passwordResetExpires`).
- Seed script is idempotent:
  - Upserts ADMIN/USER roles.
  - Upserts all permissions.
  - Assigns ADMIN full permissions; USER limited permissions.
  - Optional bootstrap users from env.

## 6) Config and Deployment Notes
- Backend hard-fails if MSSQL vars are missing: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SERVER|DB_HOST`.
- SQL executor requires both backend and frontend flags to be enabled for usable UX.
- Vite production base path is `/WB_Monitoring/`.
- Root `index.html` references built assets under `/WB_Monitoring/assets/...`.

## 7) Gaps / Risks Observed
- `backend/src/server.js` serves `frontend/build`, but Vite outputs `frontend/dist` (likely stale/unused server file).
- Sidebar currently comments out Items navigation link, though routes/API exist.
- Some frontend text shows encoding artifacts (example: arrow text in `ItemDetailPage`).
- `DashboardPage.jsx` and `AuthForm.jsx` exist but are not wired into routes.
- Build outputs are tracked in repo; `.gitignore` does not ignore `dist/` or root `assets/`.

## 8) Test Coverage
- Backend has one automated test: ESM format guard (`backend/tests/module-format.test.js`).
- No route/service integration tests found.

## 9) Practical Startup (current code)
1. Configure `backend/.env` (MySQL + MSSQL + JWT + CORS + optional mail).
2. In `backend/`: `npm install`, `npx prisma migrate deploy`, `npx prisma db seed`, `npm run dev`.
3. In `frontend/`: `npm install`, `npm run dev`.
4. Build frontend with `npm run build` for deployment to `/WB_Monitoring/`.
