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

    // Shift all showtimes so that the earliest one starts today
    const updateQuery = `
      DECLARE @diff INT;
      -- Calculate difference in days between the minimum StartTime in the table and today
      SELECT @diff = DATEDIFF(day, MIN(StartTime), GETDATE()) FROM Showtime;
      
      IF @diff IS NOT NULL
      BEGIN
          UPDATE Showtime SET 
            StartTime = DATEADD(day, @diff, StartTime),
            EndTime = DATEADD(day, @diff, EndTime);
          PRINT 'Updated showtimes by ' + CAST(@diff AS VARCHAR) + ' days.';
      END
      ELSE
      BEGIN
          PRINT 'No showtimes to update.';
      END
    `;

    const result = await pool.request().query(updateQuery);
    console.log("Update executed.");
    
    // Check new min date
    const checkResult = await pool.request().query("SELECT MIN(StartTime) as minDate, MAX(StartTime) as maxDate FROM Showtime");
    console.log("New dates range:", checkResult.recordset[0]);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

run();
