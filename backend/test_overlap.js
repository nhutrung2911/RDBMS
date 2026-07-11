const sql = require('mssql'); 
const config = {
  user: 'sa',
  password: '29112006',
  server: 'localhost\\MSSQLSERVER2',
  database: 'RDBMS',
  options: { encrypt: true, trustServerCertificate: true }
};
async function run() { 
  const pool = await sql.connect(config); 
  try { 
    const res = await pool.request().query("SELECT name, object_definition(object_id) as definition FROM sys.triggers");
    console.log("TRIGGERS:", res.recordset);
  } catch(e) {
    console.error(e);
  } finally {
    pool.close();
  }
} 
run();
