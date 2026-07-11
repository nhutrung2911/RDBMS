const sql = require('mssql'); 
async function run() { 
  const pool = await sql.connect({
    server:'localhost\\MSSQLSERVER2', 
    database:'RDBMS', 
    user:'sa', 
    password:'29112006', 
    options:{trustServerCertificate:true, encrypt:true}
  }); 
  const res = await pool.request().query("SELECT resource_type, request_mode, request_status FROM sys.dm_tran_locks WHERE request_session_id != @@SPID"); 
  console.log(res.recordset); 
  process.exit(0); 
} 
run();
