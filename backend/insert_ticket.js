const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_DATABASE || "RDBMS",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  }
};

async function run() {
  try {
    console.log("Connecting to SQL Server...");
    let pool = await sql.connect(config);
    console.log("Connected! Checking special ticket 'CNS_REVENUE_DEL'...");
    
    const checkTicket = await pool.request()
      .query("SELECT TicketId FROM Ticket WHERE TicketId = 'CNS_REVENUE_DEL'");
      
    if (checkTicket.recordset.length > 0) {
      console.log("Special ticket 'CNS_REVENUE_DEL' already exists in SQL Server!");
    } else {
      console.log("Seeding special ticket...");
      // Check if customer ID 1 exists, if not, find a customer
      const checkCust = await pool.request().query("SELECT TOP 1 CustomerId FROM Customer");
      const customerId = checkCust.recordset[0]?.CustomerId || 1;
      
      // Get seat ID 1 or a seat ID
      const checkSeat = await pool.request().query("SELECT TOP 1 SeatId FROM Seat");
      const seatId = checkSeat.recordset[0]?.SeatId || 1;
      
      // Get showtime ID 1 or a showtime ID
      const checkSt = await pool.request().query("SELECT TOP 1 ShowtimeId FROM Showtime");
      const showtimeId = checkSt.recordset[0]?.ShowtimeId || 1;
      
      await pool.request()
        .input("ticketId", sql.VarChar, "CNS_REVENUE_DEL")
        .input("customerId", sql.Int, customerId)
        .input("totalPrice", sql.Decimal(18,2), 1200000.00)
        .query(`
          INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status)
          VALUES (@ticketId, @customerId, '2026-06-15 10:00:00', @totalPrice, N'Tiền mặt', 'nguyennhutrung788@gmail.com', N'valid')
        `);
        
      await pool.request()
        .input("ticketId", sql.VarChar, "CNS_REVENUE_DEL")
        .input("showtimeId", sql.Int, showtimeId)
        .input("seatId", sql.Int, seatId)
        .input("price", sql.Decimal(18,2), 1200000.00)
        .query(`
          INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
          VALUES (@ticketId, @showtimeId, @seatId, @price)
        `);
        
      console.log("Special ticket 'CNS_REVENUE_DEL' seeded successfully into physical SQL Server!");
    }
    
    await sql.close();
  } catch (err) {
    console.error("Error inserting special ticket:", err.message);
  }
}
run();
