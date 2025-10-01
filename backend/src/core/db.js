import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import sql from 'mssql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure environment variables are loaded when the module is imported
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config();

function toBool(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
}

function toNumber(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

const server = process.env.DB_SERVER || process.env.DB_HOST;
const requiredVars = {
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_SERVER: server,
};

const missingVars = Object.entries(requiredVars)
  .filter(([, value]) => !value)
  .map(([key]) => (key === 'DB_SERVER' ? 'DB_SERVER/DB_HOST' : key));

if (missingVars.length) {
  throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
}

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server,
  database: process.env.DB_NAME,
  port: toNumber(process.env.DB_PORT, undefined),
  options: {
    encrypt: toBool(process.env.DB_ENCRYPT, true),
    trustServerCertificate: toBool(process.env.DB_TRUST_SERVER_CERT, false),
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log('Connected to MSSQL');
    return pool;
  })
  .catch((err) => {
    console.error('Database Connection Failed!', err);
    throw err;
  });

export async function execute(query, params = []) {
  const pool = await poolPromise;
  const request = pool.request();
  for (const { name, type, value } of params) {
    request.input(name, type, value);
  }
  return request.query(query);
}

export { sql, poolPromise };

