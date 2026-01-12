# AI System Summary (WB Monitoring)

This repository contains a React (Vite) frontend and an Express backend for
weighbridge (WB) operational workflows plus a separate auth/permissions layer.

## High-level Architecture
- Frontend: React + Vite in `frontend/` with Tailwind utilities and custom CSS.
- Backend: Express API in `backend/` with:
  - MySQL (via Prisma) for authentication, roles, permissions, items, refresh tokens.
  - MSSQL for weighbridge business tables (WB_IN, WB_OUT).

## Core Workflows (MSSQL)
- FFB Reupload: search WB_IN by WERKS/date; reset ZSAPFLAG to "N".
- Split SO: find WB_OUT ticket by MWERKS/date/ticket; update VBELN/POSNR fields; reset ZSAPFLAG.
- Car Plate Update: update CPLATE and ZSAPFLAG in WB_OUT and WB_IN in a single MSSQL transaction.
- Barge Update: read/update GROSS_QTY and NETBG_QTY in WB_OUT by MWERKS + ticket; reset ZSAPFLAG.
- SQL Executor: optional SELECT-only executor, disabled by default via env flags.

## Auth and Authorization (MySQL via Prisma)
- JWT access tokens (short-lived) + refresh token rotation stored as hashed records.
- Role/permission model enforced on `/api/users`, `/api/items`, and all MSSQL workflow routes.
- Admin and User roles seeded; permissions enumerated in Prisma schema (includes WB_* permissions).

## API Surface (Backend)
- Auth: `/api/auth/*` (register, login, refresh, logout, forgot/reset password).
- Users: `/api/users/*` (protected by auth + permission checks).
- Items: `/api/items/*` (protected by auth + permission checks).
- MSSQL workflows: `/api/ffb-reupload/*`, `/api/split-so/*`, `/api/cp-update/*`, `/api/barge-update/*` (auth + permission gated).
- SQL Executor: `/api/sqlexecute` (auth + permission gated; only if enabled).

## Frontend Routing
- Public: login, register, forgot/reset password, unauthorized.
- Protected: dashboard/home, items, item detail.
- Admin-only: user management.
- Permission-based: FFB reupload, Split SO, car plate update, barge update, SQL executor.

## Data Flow
- Frontend uses Axios with an inferred API base URL (env or window location).
- Authenticated requests use a private Axios instance with bearer tokens (including MSSQL workflows and SQL executor).
- Refresh token is stored in an httpOnly cookie and rotated on refresh.

## Key Config and Constraints
- MSSQL env vars are required at startup; backend fails fast if missing.
- CORS allowlist uses `FRONTEND_URLS` or `FRONTEND_URL`.
- SQL executor must remain disabled in production by default (`ENABLE_SQL_EXECUTOR` + `VITE_ENABLE_SQL_EXECUTOR`).
