# WB Monitoring

A React + Express application for managing weighbridge (WB) data workflows such as FFB reuploads, split SO corrections, car-plate updates, and barge quantity adjustments. The backend connects to Microsoft SQL Server.

## Features

- Reset `ZSAPFLAG` for selected FFB tickets.
- Amend split sales orders and car-plate details in WB tables.
- Update barge gross/net quantities with live validation.
- Optional (disabled) SQL `SELECT` executor for ad-hoc queries.

## Prerequisites

- Node.js 18+
- Microsoft SQL Server (reachable from the backend)
- npm (bundled with Node.js)

## Configuration

The backend now relies on environment variables. Copy the template and fill in secure values:

```bash
cd backend
cp .env.example .env  # or copy manually on Windows
```

Update `.env` with your database credentials and preferences:

```ini
DB_USER=your_db_user
DB_PASSWORD=your_strong_password
DB_HOST=db.example.com
DB_NAME=WBStagingDB
# DB_PORT=1433
# DB_ENCRYPT=true
# DB_TRUST_SERVER_CERT=false

PORT=3000
ENABLE_SQL_EXECUTOR=false
```

> `ENABLE_SQL_EXECUTOR` must remain `false` in production. Set it to `true` only for trusted maintenance environments.

On the frontend you can optionally expose the SQL executor by creating `frontend/.env`:

```ini
REACT_APP_ENABLE_SQL_EXECUTOR=false
```

Both sides default to disabled, so the UI will hide the tool and the backend will reject requests.

## Installation

```bash
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd ../frontend
npm install
```

## Prisma Database Setup

Prisma maintains the authentication and authorization tables in MySQL; ensure `backend/.env` contains a valid `DATABASE_URL` before running these commands.

### Apply migrations

```bash
cd backend
npx prisma migrate deploy
```

Use `npx prisma migrate dev --name descriptive_name` during development to create and apply new migrations in one step.

### Seed reference data

```bash
cd backend
npx prisma db seed
```

The seed script is idempotent and will insert default roles, permissions, and optional admin/user accounts when `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD` are set in `.env`.

## Running Locally

```bash
# Backend
cd backend
npm start
# -> http://localhost:3000

# Frontend
cd frontend
npm start
# -> http://localhost:3001 (CRA default)
```

The React app proxies API calls to the backend via `frontend/package.json`.

## Security Notes

- Database credentials are no longer stored in source control; the server will refuse to start if required vars are missing.
- SQL executor endpoints are opt-in and limited to a single `SELECT` statement even when enabled.
- TLS is enabled by default on SQL connections (`encrypt=true`). Disable only for legacy/local instances using `DB_TRUST_SERVER_CERT=true`.

## Enabling the SQL Executor (for maintenance only)

1. Set `ENABLE_SQL_EXECUTOR=true` in `backend/.env`.
2. Set `REACT_APP_ENABLE_SQL_EXECUTOR=true` in `frontend/.env` and rebuild the frontend (`npm start` reloads automatically).
3. Restart both servers.

The executor still enforces single-statement `SELECT` queries, and attempted use while disabled returns HTTP 403.

## Troubleshooting

- **Database connection fails**: verify host/port reachability and that TLS settings match the SQL Server configuration.
- **SQL executor hidden**: ensure both environment variables are set to `true` and restart the servers.
- **Barge quantities reset to blank**: with the new release, zero values are preserved; if you still see blanks, confirm the API returns data.

## License

Internal use only. Update this section if you plan to distribute the project.

