const sql = require('mssql');

const config = {
  server: 'localhost\\MSSQLSERVER2',
  database: 'RDBMS',
  user: 'sa',
  password: '29112006',
  options: {
    trustServerCertificate: true,
    encrypt: true
  }
};

async function check() {
  try {
    const pool = await sql.connect(config);
    
    console.log("=== ALL TICKETS IN DATABASE ===");
    const res = await pool.request().query(`
      SELECT t.TicketId, t.UserEmail, t.Status, td.ShowtimeId, s.SeatNumber 
      FROM Ticket t
      LEFT JOIN TicketDetail td ON t.TicketId = td.TicketId
      LEFT JOIN Seat s ON td.SeatId = s.SeatId
    `);
    console.log(JSON.stringify(res.recordset, null, 2));

    await sql.close();
  } catch (err) {
    console.error("Loi:", err);
  }
}

check();
