Here is a complete `README.md` file for your **FFB Reupload System (WB\_Monitoring)**, based on your project structure and description:

---

```markdown
# FFB Reupload System – WB Monitoring

A web-based system for managing Fresh Fruit Bunch (FFB) ticket reuploading from MSSQL database. This tool allows users to reset `ZSAPFLAG` for specific `WERKS` codes and date ranges.

## 📁 Project Structure

```

WB\_Monitoring/
├── app.js                         # Express app setup
├── server.js                      # Main entry point, starts HTTP server
├── core/
│   └── db.js                      # Database connection setup (MSSQL)
├── modules/
│   └── ffb-reupload/
│       ├── ffb.routes.js         # Route definitions for FFB API
│       └── ffb.controller.js     # Business logic for search and reupload
├── public/
│   └── ffb-reupload.html         # Frontend interface for ticket reupload
├── README.md                      # Project documentation

````

---

## 🚀 How It Works

### 1. `server.js`
- Starts the Express server.
- Serves static files from `/public`.
- Serves the main HTML interface at `/`.
- Mounts the FFB Reupload API at `/api/ffb-reupload`.

### 2. `app.js`
- Configures the Express application instance.
- Applies middleware like `express.json()`.
- Imports and mounts API routes from `/modules/ffb-reupload`.

### 3. `core/db.js`
- Uses `mssql` and `tedious` packages to create and export a MSSQL connection pool.
- Shared across the application using `poolPromise`.

### 4. `ffb.controller.js`
Defines three main controller functions:
- `getWerks()`: Returns a list of distinct `WERKS` values from `WB_IN` table.
- `search()`: Retrieves ticket data based on `WERKS` and `WB_DATE_IN` range.
- `reupload()`: Sets `ZSAPFLAG = 'N'` for selected records.

### 5. `ffb.routes.js`
Registers routes:
- `GET /api/ffb-reupload/werks`
- `POST /api/ffb-reupload/search`
- `POST /api/ffb-reupload/reupload`

### 6. `public/ffb-reupload.html`
- Frontend interface to interact with the backend API.
- Allows users to:
  - Select a WERKS value.
  - Pick a date range.
  - View results in a table.
  - Reupload FFB tickets by clicking a button.

---

## ⚙️ Setup Instructions

### Prerequisites:
- Node.js & npm
- Microsoft SQL Server running
- XAMPP (for local web environment)
- Port `1433` open for MSSQL

### Step-by-Step:

1. **Install Dependencies:**
   ```bash
   npm install
````

2. **Configure DB Connection (`core/db.js`):**

   ```js
   const config = {
     user: "wbuser",
     password: "Sawit@2025",
     server: "localhost",
     database: "WBStagingDB",
     options: {
       encrypt: false,
       trustServerCertificate: true
     }
   };
   ```

3. **Start the Server:**

   ```bash
   node server.js
   ```

4. **Open in Browser:**

   ```
   http://localhost:3000
   ```

---

## 🔌 API Reference

### GET `/api/ffb-reupload/werks`

* Returns array of `WERKS` codes.

### POST `/api/ffb-reupload/search`

**Request Body:**

```json
{
  "werks": "1001",
  "dateFrom": "2025-06-01",
  "dateTo": "2025-06-15"
}
```

**Response:** List of matching FFB records.

### POST `/api/ffb-reupload/reupload`

**Request Body:**

```json
{
  "werks": "1001",
  "dateFrom": "2025-06-01",
  "dateTo": "2025-06-15"
}
```

**Response:** `"FFB tickets reuploaded successfully."`

---

## 🛠️ SQL Setup

To create a new SQL user for the system:

```sql
-- Create login
CREATE LOGIN wbuser WITH PASSWORD = 'Sawit@2025';

-- Create user for the login in your DB
USE WBStagingDB;
CREATE USER wbuser FOR LOGIN wbuser;

-- Grant access
ALTER ROLE db_datareader ADD MEMBER wbuser;
ALTER ROLE db_datawriter ADD MEMBER wbuser;
```

---

## 🔒 Security Notes

* Make sure to restrict access to `wbuser` if deploying publicly.
* Avoid hardcoding credentials in `db.js`. Use `.env` file for sensitive config.

---

## 👤 Author

Developed by Fadzrul, Software Engineer – System Analyst
Contact: Internal IT, SKG Palm Oil

---

## 📌 Future Improvements

* Add login/audit logs for tracking reupload activity.
* Export search results to CSV.
* Add date picker UI and loading indicators.

---

# WB_Monitoring

## Project Structure

- `/frontend` - React.js frontend
- `/backend` - Express.js backend

## Development

1. Install dependencies in both `frontend` and `backend`:
   ```
   cd frontend && npm install
   cd ../backend && npm install
   ```
2. Start backend:
   ```
   cd backend && npm start
   ```
3. Start frontend:
   ```
   cd frontend && npm start
   ```

The frontend is configured to proxy API requests to the backend.

```

---

Let me know if you'd like the file exported or saved in a specific format (e.g., `.md`, `.pdf`, etc.).
