import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig: sql.config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "RDBMS",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;
let isMockMode = false;

export async function connectDatabase(): Promise<sql.ConnectionPool | null> {
  if (pool) return pool;

  try {
    console.log(`Connecting to SQL Server: ${dbConfig.server} (${dbConfig.database})...`);
    pool = await sql.connect(dbConfig);
    console.log("SQL Server connected successfully! Using real database mode.");
    isMockMode = false;
    return pool;
  } catch (err: any) {
    console.error("======================================================================");
    console.error("WARNING: Failed to connect to SQL Server database.");
    console.error(`Error details: ${err?.message || err}`);
    console.error("BACKEND WILL FALLBACK TO IN-MEMORY MOCK DATA MODE.");
    console.error("======================================================================");
    pool = null;
    isMockMode = true;
    return null;
  }
}

export function getMockMode(): boolean {
  return isMockMode;
}

export { sql };
