const sql = require('mssql'); 
async function run() { 
  const pool = await sql.connect({
    server:'localhost\\MSSQLSERVER2', 
    database:'RDBMS', 
    user:'sa', 
    password:'29112006', 
    options:{trustServerCertificate:true, encrypt:true}
  }); 
  const start = Date.now(); 
  console.log('Inserting...'); 
  await pool.request().query("INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price) VALUES (1, 1, '2026-07-04 23:00', '2026-07-05 01:00', 90000)"); 
  console.log('Inserted in', Date.now() - start, 'ms'); 
  process.exit(0); 
} 
run();
