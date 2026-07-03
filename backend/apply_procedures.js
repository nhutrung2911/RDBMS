const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const config = {
  server: 'localhost\\MSSQLSERVER2',
  database: 'master', // Connect to master so we can drop/create RDBMS database
  user: 'sa',
  password: '29112006',
  options: {
    trustServerCertificate: true,
    encrypt: true
  }
};

async function applyMigration() {
  try {
    const sqlFilePath = path.join(__dirname, '../database/CineStar_Database_Setup.sql');
    console.log(`Reading SQL file: ${sqlFilePath}...`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL commands by GO (accounting for newlines, casing, and spacing around GO)
    const rawBatches = sqlContent.split(/^\s*GO\s*$/im);
    const batches = rawBatches
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);

    console.log(`Split SQL into ${batches.length} execution batches. Connecting to master database...`);
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server master database! Applying batches...");

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        await pool.request().query(batch);
        console.log(`[Batch ${i + 1}/${batches.length}] Success!`);
      } catch (batchErr) {
        console.error(`[Batch ${i + 1}/${batches.length}] Failed! Error: ${batchErr.message}`);
        // Log first 150 chars of the failing batch
        console.error("Snippet:", batch.substring(0, 150) + "...");
        throw batchErr;
      }
    }

    console.log("Migration applied successfully! Database recreated and all stored procedures updated.");
    await sql.close();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

applyMigration();
