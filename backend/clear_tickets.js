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

async function clear() {
  try {
    const pool = await sql.connect(config);
    
    console.log("Dang xoa cac ve test CNS4J3KI va CNSIPGWP de giai phong ghe A2 va A5...");
    await pool.request().query(`
      DELETE FROM TicketDetail WHERE TicketId IN ('CNS4J3KI', 'CNSIPGWP');
      DELETE FROM Ticket WHERE TicketId IN ('CNS4J3KI', 'CNSIPGWP');
    `);
    console.log("Xoa cac ve test thanh cong!");

    // Tu dong khoi phuc lai ve mau CNS_REVENUE_DEL neu no bi xoa trong luc chay kich ban bao cao
    const checkRevenueDel = await pool.request().query(`
      SELECT 1 FROM Ticket WHERE TicketId = 'CNS_REVENUE_DEL'
    `);
    
    if (checkRevenueDel.recordset.length === 0) {
      console.log("Ve CNS_REVENUE_DEL da bi xoa trong qua trinh test truoc. Dang tu dong nap lai de san sang cho kich ban bao cao...");
      await pool.request().query(`
        INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status) 
        VALUES ('CNS_REVENUE_DEL', 1, '2026-06-15 10:00:00', 1200000.00, N'Tiền mặt', 'nguyennhutrung788@gmail.com', N'valid');
        
        INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price) 
        VALUES ('CNS_REVENUE_DEL', 1, (SELECT TOP 1 SeatId FROM Seat WHERE RoomId = 1), 1200000.00);
      `);
      console.log("Khoi phuc ve CNS_REVENUE_DEL thanh cong!");
    } else {
      console.log("Ve CNS_REVENUE_DEL van dang ton tai trong database de phuc vu kich ban test Non-repeatable Read.");
    }

    await sql.close();
  } catch (err) {
    console.error("Loi:", err);
  }
}

clear();
