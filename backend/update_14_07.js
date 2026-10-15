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

    // Delete existing showtimes on 14/07 to avoid duplicates or overlap if we are regenerating
    await pool.request().query(`
      DELETE FROM TicketDetail WHERE ShowtimeId IN (
        SELECT ShowtimeId FROM Showtime WHERE CAST(StartTime as DATE) = '2026-07-14'
      );
      DELETE FROM Showtime WHERE CAST(StartTime as DATE) = '2026-07-14';
    `);

    // Copy all showtimes from 2026-07-13 (today) and insert them into 2026-07-14
    const result = await pool.request().query(`
      INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price)
      SELECT 
        MovieId, 
        RoomId, 
        DATEADD(day, 1, StartTime), 
        DATEADD(day, 1, EndTime), 
        Price
      FROM Showtime
      WHERE CAST(StartTime as DATE) = '2026-07-13';
      
      -- Also copy from 2026-07-15 to make it even more full
      INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price)
      SELECT 
        MovieId, 
        RoomId, 
        DATEADD(day, -1, StartTime), 
        DATEADD(day, -1, EndTime), 
        Price
      FROM Showtime
      WHERE CAST(StartTime as DATE) = '2026-07-15'
      AND RoomId NOT IN (SELECT RoomId FROM Showtime WHERE CAST(StartTime as DATE) = '2026-07-14');
    `);

    console.log("Successfully generated showtimes for 14/07.");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
