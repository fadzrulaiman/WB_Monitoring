# WB Monitoring

A React + Express application for managing weighbridge (WB) data workflows such as FFB reuploads, split SO corrections, car-plate updates, and barge quantity adjustments. The backend connects to Microsoft SQL Server.

## Features

- Reset `ZSAPFLAG` for selected FFB tickets.
- Amend split sales orders and car-plate details in WB tables.
- Update barge gross/net quantities with live validation.
- Optional (disabled) SQL `SELECT` executor for ad-hoc queries.

## Prerequisites

- Node.js 18+
- npm (bundled with Node.js)
- Microsoft SQL Server (reachable from the backend, provides WB_IN/WB_OUT tables)
- MySQL (for auth, roles, permissions, items, refresh tokens)
- Optional: SMTP service for password reset emails

## Configuration

Create `backend/.env` (copy `backend/.env.example` if you add one) and fill in secure values:

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
VITE_ENABLE_SQL_EXECUTOR=false
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
# Backend (with nodemon)
cd backend
npm run dev
# -> http://localhost:3000

# Frontend (Vite)
cd frontend
npm run dev
# -> http://localhost:5173
```

The frontend uses `VITE_API_BASE_URL` or `VITE_API_PORT` (see `frontend/src/api/axios.js`) to reach the backend.

## New Server Setup (Production)

1. Install Node.js 18+ and npm on the server.
2. Provision databases:
   - MySQL database for Prisma auth tables.
   - MSSQL access with a user that can read/write `WB_IN` and `WB_OUT`.
3. Clone the repository to the server.
4. Install dependencies:

```bash
cd backend
npm install
cd ../frontend
npm install
```

5. Create `backend/.env` with required values (MySQL `DATABASE_URL`, MSSQL `DB_*`, JWT secrets, CORS origins, email settings).
6. Create `frontend/.env` with `VITE_API_BASE_URL` (or `VITE_API_PORT`) and optional `VITE_ENABLE_SQL_EXECUTOR`.
7. Run Prisma migrations and seed:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

8. Build the frontend:

```bash
cd frontend
npm run build
```

9. Start the backend:

```bash
cd backend
npm start
```

10. Serve the frontend build (from `frontend/dist`) using your preferred web server, or adjust `backend/src/server.js` to point at `frontend/dist` if you want Node to serve the static files.

### Windows + XAMPP example (HTTPS + /api proxy)

If the frontend is served over HTTPS, the API must also be HTTPS to avoid mixed-content blocks. The simplest fix is to proxy `/api` through Apache and set `VITE_API_BASE_URL=/api` before building.

1. Enable required Apache modules in `C:\xampp\apache\conf\httpd.conf`:

```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
LoadModule ssl_module modules/mod_ssl.so
```

2. Update your SSL virtual host in `C:\xampp\apache\conf\extra\httpd-ssl.conf`:

```apache
<VirtualHost _default_:443>
  ServerName 10.13.1.223:443
  DocumentRoot "C:/xampp/htdocs/WB_Monitoring"

  ProxyPreserveHost On
  ProxyPass "/api/" "http://127.0.0.1:3000/api/"
  ProxyPassReverse "/api/" "http://127.0.0.1:3000/api/"
</VirtualHost>
```

3. Set the frontend API base URL and rebuild:

```ini
VITE_API_BASE_URL=/api
```

```bash
cd frontend
npm run build
```

4. Copy the contents of `frontend/dist` into `C:\xampp\htdocs\WB_Monitoring` and restart Apache.
5. Ensure `FRONTEND_URLS` in `backend/.env` includes your HTTPS origin (for example `https://10.13.1.223`), then restart the backend.

### Keep the backend running (PM2)

```bash
cd backend
npm i -g pm2
pm2 start src/index.js --name wb-backend
pm2 save
```

On Windows, use a service wrapper (for example `pm2-installer` or `pm2-windows-service`) so PM2 starts on boot.

### Updating a deployed server

```bash
cd C:\xampp\htdocs\WB_Monitoring
git pull origin <branch>

cd backend
npm install
npx prisma generate
npx prisma migrate deploy
pm2 restart wb-backend

cd ../frontend
npm install
npm run build
```

Copy the contents of `frontend/dist` to your web root after each build.

## Security Notes

- Database credentials are no longer stored in source control; the server will refuse to start if required vars are missing.
- SQL executor endpoints are opt-in and limited to a single `SELECT` statement even when enabled.
- TLS is enabled by default on SQL connections (`encrypt=true`). Disable only for legacy/local instances using `DB_TRUST_SERVER_CERT=true`.

## Enabling the SQL Executor (for maintenance only)

1. Set `ENABLE_SQL_EXECUTOR=true` in `backend/.env`.
2. Set `VITE_ENABLE_SQL_EXECUTOR=true` in `frontend/.env` and rebuild the frontend (`npm start` reloads automatically).
3. Ensure the requesting user has the `WB_SQL_EXECUTE` permission.
4. Restart both servers.

The executor still enforces single-statement `SELECT` queries, and attempted use while disabled returns HTTP 403.

## Troubleshooting

- **Database connection fails**: verify host/port reachability and that TLS settings match the SQL Server configuration.
- **SQL executor hidden**: ensure both environment variables are set to `true` and restart the servers.
- **Barge quantities reset to blank**: with the new release, zero values are preserved; if you still see blanks, confirm the API returns data.

## License

Internal use only. Update this section if you plan to distribute the project.

