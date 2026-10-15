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
    const res = await pool.request().query("SELECT MovieId, COUNT(*) as count FROM Showtime WHERE CAST(StartTime as DATE) = '2026-07-14' GROUP BY MovieId");
    console.log("SHOWTIMES ON 14/07 BY MOVIE:", res.recordset);
  } catch(e) {
    console.error(e);
  } finally {
    pool.close();
  }
} 
run();
