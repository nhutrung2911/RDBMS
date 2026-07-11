const sql = require('mssql'); 
async function run() { 
  const pool = await sql.connect({
    server:'localhost\\MSSQLSERVER2', 
    database:'RDBMS', 
    user:'sa', 
    password:'29112006', 
    options:{trustServerCertificate:true, encrypt:true}
  }); 
  const tx = new sql.Transaction(pool); 
  await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE); 
  console.log('Transaction started'); 
  await tx.request().query("SELECT * FROM Showtime WHERE CONVERT(VARCHAR(10), StartTime, 120) = '2026-07-04'"); 
  console.log('Query done, waiting 10s...'); 
  await new Promise(r => setTimeout(r, 10000)); 
  await tx.commit(); 
  console.log('Committed'); 
  process.exit(0); 
} 
run();
