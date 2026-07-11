const sql = require('mssql');

async function run() {
  try {
    const pool = await sql.connect({
      server: 'localhost\\MSSQLSERVER2',
      database: 'RDBMS',
      user: 'sa',
      password: '29112006',
      options: { trustServerCertificate: true, encrypt: true }
    });

    console.log("Connected to DB.");

    // The shift we applied to Showtime earlier was 7 days (from 2026-07-04 to 2026-07-11)
    // We apply the same shift to Movie and Ticket
    const updateQuery = `
      -- Shift Movie release dates
      UPDATE Movie SET ReleaseDate = DATEADD(day, 7, ReleaseDate);
      
      -- Shift Ticket booking times
      UPDATE Ticket SET BookingTime = DATEADD(day, 7, BookingTime);
      
      PRINT 'Updated Movie and Ticket dates by 7 days.';
    `;

    await pool.request().query(updateQuery);
    console.log("Update executed successfully.");
    
    // Print new values for verification
    const m = await pool.request().query('SELECT MovieID, Title, ReleaseDate FROM Movie'); 
    console.table(m.recordset); 
    const t = await pool.request().query('SELECT TOP 5 TicketID, BookingTime FROM Ticket'); 
    console.table(t.recordset);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
