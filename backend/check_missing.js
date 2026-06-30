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

const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const day0 = getLocalDateString(0);
const day1 = getLocalDateString(1);
const day2 = getLocalDateString(2);

const staticShowtimes = [
  { id: 1, movieId: 1, cinemaId: 1, date: day0, time: "09:30", hall: "Hall 1", price: 130000.00 },
  { id: 2, movieId: 1, cinemaId: 1, date: day0, time: "12:15", hall: "Hall 2", price: 90000.00 },
  { id: 3, movieId: 1, cinemaId: 1, date: day0, time: "15:00", hall: "Hall 3", price: 150000.00 },
  { id: 4, movieId: 1, cinemaId: 1, date: day0, time: "18:30", hall: "Hall 1", price: 130000.00 },
  { id: 5, movieId: 1, cinemaId: 1, date: day0, time: "21:00", hall: "Hall 2", price: 90000.00 },
  { id: 6, movieId: 1, cinemaId: 2, date: day1, time: "10:00", hall: "Hall A", price: 90000.00 },
  { id: 7, movieId: 1, cinemaId: 2, date: day1, time: "14:30", hall: "Hall B", price: 200000.00 },
  { id: 8, movieId: 1, cinemaId: 2, date: day1, time: "19:45", hall: "Hall A", price: 90000.00 },
  { id: 9, movieId: 1, cinemaId: 3, date: day2, time: "11:00", hall: "Hall X", price: 130000.00 },
  { id: 10, movieId: 1, cinemaId: 3, date: day0, time: "16:00", hall: "Hall Y", price: 150000.00 },
  { id: 11, movieId: 2, cinemaId: 1, date: day0, time: "10:30", hall: "Hall 2", price: 90000.00 },
  { id: 12, movieId: 2, cinemaId: 1, date: day1, time: "14:00", hall: "Hall 3", price: 150000.00 },
  { id: 13, movieId: 2, cinemaId: 1, date: day2, time: "17:45", hall: "Hall 1", price: 130000.00 },
  { id: 14, movieId: 3, cinemaId: 2, date: day0, time: "09:00", hall: "Hall A", price: 90000.00 },
  { id: 15, movieId: 3, cinemaId: 2, date: day1, time: "11:30", hall: "Hall B", price: 90000.00 },
  { id: 16, movieId: 3, cinemaId: 1, date: day0, time: "14:15", hall: "Hall 2", price: 90000.00 },
  { id: 17, movieId: 3, cinemaId: 1, date: day1, time: "16:45", hall: "Hall 3", price: 90000.00 }
];

async function check() {
  try {
    const pool = await sql.connect(config);
    
    // Check movies in database
    const dbMovies = await pool.request().query("SELECT MovieId, Title, Status FROM Movie");
    console.log("=== Movies in DB ===");
    console.table(dbMovies.recordset);

    // Check showtimes in database
    const dbShowtimes = await pool.request().query(`
      SELECT st.ShowtimeId, st.MovieId, m.Title, st.RoomId, r.RoomName, st.StartTime, st.Price 
      FROM Showtime st
      JOIN Movie m ON st.MovieId = m.MovieId
      JOIN Room r ON st.RoomId = r.RoomId
    `);
    console.log("=== Showtimes in DB ===");
    console.table(dbShowtimes.recordset.map(s => ({
      ShowtimeId: s.ShowtimeId,
      MovieId: s.MovieId,
      Title: s.Title,
      RoomName: s.RoomName,
      StartTime: s.StartTime.toISOString(),
      Price: s.Price
    })));

    // Find which of staticShowtimes are missing from the database
    const missing = [];
    for (const ss of staticShowtimes) {
      const exists = dbShowtimes.recordset.some(ds => ds.ShowtimeId === ss.id);
      if (!exists) {
        missing.push(ss);
      }
    }

    console.log("=== Static showtimes missing from DB ===");
    console.table(missing);

    await sql.close();
  } catch (err) {
    console.error("Loi:", err);
  }
}

check();
