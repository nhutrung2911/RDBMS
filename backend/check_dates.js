const sql = require('mssql');

async function run() {
  try {
    const pool = await sql.connect({
      server: 'localhost\\MSSQLSERVER2',
      database: 'RDBMS',
      user: 'sa',
      password: '29112006',
      options: { trustServerCertificate: true, encrypt: true }
    });

    const result = await pool.request().query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE DATA_TYPE IN ('date', 'datetime', 'datetime2')
    `);
    
    console.table(result.recordset);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
