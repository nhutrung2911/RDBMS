const sql = require('mssql');
require('dotenv').config();

const config = {
  server: 'localhost\\MSSQLSERVER2',
  database: process.env.DB_DATABASE || 'RDBMS',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '29112006',
  options: {
    trustServerCertificate: true,
    encrypt: true
  }
};

async function check() {
  try {
    const pool = await sql.connect(config);
    
    console.log("\n====================================================================");
    console.log("             LICH SU HOA DON DAT VE MOI NHAT TRONG DATABASE");
    console.log("====================================================================");
    const tickets = await pool.request().query(`
      SELECT TOP 10 TicketId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status 
      FROM Ticket 
      ORDER BY BookingTime DESC
    `);
    console.table(tickets.recordset);

    console.log("\n====================================================================");
    console.log("             DANH SACH GHE DA BAN CUA SUAT CHIEU ID = 1");
    console.log("====================================================================");
    const seats = await pool.request().query(`
      SELECT td.TicketId, s.SeatNumber, td.Price 
      FROM TicketDetail td
      JOIN Seat s ON td.SeatId = s.SeatId
      WHERE td.ShowtimeId = 1
    `);
    console.table(seats.recordset);

    await sql.close();
  } catch (err) {
    console.error("Loi:", err);
  }
}

check();
