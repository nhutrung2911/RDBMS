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
    // CinemaId 3 (Landmark 81) has RoomId 6 and 7
    const res = await pool.request().query("SELECT * FROM Showtime WHERE MovieId=1 AND RoomId IN (6, 7)");
    console.log("SHOWTIMES FOR LANDMARK 81:", res.recordset);
  } catch(e) {
    console.error(e);
  } finally {
    pool.close();
  }
} 
run();
