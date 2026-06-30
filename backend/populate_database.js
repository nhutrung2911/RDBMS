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

const day0 = getLocalDateString(0); // Today
const day1 = getLocalDateString(1); // Tomorrow
const day2 = getLocalDateString(2); // Day after

// The 25 showtimes covering all now_showing movies (1, 2, 3, 4, 5) mapped to respective dynamic dates
const showtimesToSeed = [
  // Movie 1: Dune: Part Two
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

  // Movie 2: Godzilla x Kong
  { id: 11, movieId: 2, cinemaId: 1, date: day0, time: "10:00", hall: "Hall 2", price: 90000.00 },
  { id: 12, movieId: 2, cinemaId: 1, date: day1, time: "14:00", hall: "Hall 3", price: 150000.00 },
  { id: 13, movieId: 2, cinemaId: 1, date: day2, time: "17:45", hall: "Hall 1", price: 130000.00 },

  // Movie 3: Kung Fu Panda 4
  { id: 14, movieId: 3, cinemaId: 2, date: day0, time: "09:00", hall: "Hall A", price: 90000.00 },
  { id: 15, movieId: 3, cinemaId: 2, date: day1, time: "11:30", hall: "Hall B", price: 90000.00 },
  { id: 16, movieId: 3, cinemaId: 1, date: day0, time: "15:30", hall: "Hall 2", price: 90000.00 },
  { id: 17, movieId: 3, cinemaId: 1, date: day1, time: "16:45", hall: "Hall 3", price: 90000.00 },

  // Movie 4: Nội Chiến (Civil War)
  { id: 18, movieId: 4, cinemaId: 4, date: day0, time: "14:00", hall: "Hall I", price: 90000.00 },
  { id: 19, movieId: 4, cinemaId: 4, date: day1, time: "16:30", hall: "Hall II", price: 90000.00 },
  { id: 20, movieId: 4, cinemaId: 5, date: day0, time: "19:00", hall: "Hall Alpha", price: 90000.00 },
  { id: 21, movieId: 4, cinemaId: 6, date: day1, time: "20:00", hall: "Hall Gold", price: 90000.00 },

  // Movie 5: Người Đóng Thế (The Fall Guy)
  { id: 22, movieId: 5, cinemaId: 4, date: day0, time: "11:15", hall: "Hall II", price: 90000.00 },
  { id: 23, movieId: 5, cinemaId: 5, date: day1, time: "13:30", hall: "Hall Beta", price: 90000.00 },
  { id: 24, movieId: 5, cinemaId: 6, date: day0, time: "15:45", hall: "Hall Silver", price: 90000.00 },
  { id: 25, movieId: 5, cinemaId: 1, date: day2, time: "18:00", hall: "Hall 2", price: 90000.00 }
];

async function seed() {
  try {
    const pool = await sql.connect(config);
    console.log("Ket noi database thanh cong. Bat dau dong bo hoa suat chieu...");

    // 1. Cleansing existing tables relating to showtimes & tickets to avoid FK errors
    await pool.request().query(`
      ALTER TABLE TicketDetail DROP CONSTRAINT IF EXISTS FK_TicketDet__Showt__5DCAEF64;
      DELETE FROM TicketDetail;
      DELETE FROM Ticket;
      DELETE FROM Showtime;
      DELETE FROM Seat;
      DELETE FROM Room;
      DELETE FROM Cinema;
    `);
    console.log("- Da lam sach cac bang (TicketDetail, Ticket, Showtime, Seat, Room, Cinema)");

    // 2. Re-insert Cinemas matching the frontend list (IDs 1-6)
    await pool.request().query(`
      SET IDENTITY_INSERT Cinema ON;
      INSERT INTO Cinema (CinemaId, CinemaName, Address, City) VALUES
      (1, N'CGV Vincom Center', N'72 Lê Thánh Tôn, Q.1', N'TP. Hồ Chí Minh'),
      (2, N'CGV Aeon Mall Tân Phú', N'30 Bờ Bao Tân Thắng, Q. Tân Phú', N'TP. Hồ Chí Minh'),
      (3, N'CGV Landmark 81', N'208 Nguyễn Hữu Cảnh, Q. Bình Thạnh', N'TP. Hồ Chí Minh'),
      (4, N'CGV Vincom Bà Triệu', N'191 Bà Triệu, Q. Hai Bà Trưng', N'Hà Nội'),
      (5, N'CGV Royal City', N'72A Nguyễn Trãi, Q. Thanh Xuân', N'Hà Nội'),
      (6, N'CGV Vincom Đà Nẵng', N'910A Ngô Quyền, Q. Sơn Trà', N'Đà Nẵng');
      SET IDENTITY_INSERT Cinema OFF;
    `);
    console.log("- Da khoi tao 6 Rap chieu phim khop voi Frontend");

    // 3. Re-insert Rooms matching the frontend halls list for Cinema 1-6
    await pool.request().query(`
      SET IDENTITY_INSERT Room ON;
      INSERT INTO Room (RoomId, RoomName, Capacity, CinemaId) VALUES
      (1, N'Hall 1', 120, 1),
      (2, N'Hall 2', 120, 1),
      (3, N'Hall 3', 120, 1),
      (4, N'Hall A', 120, 2),
      (5, N'Hall B', 120, 2),
      (6, N'Hall X', 120, 3),
      (7, N'Hall Y', 120, 3),
      (8, N'Hall I', 120, 4),
      (9, N'Hall II', 120, 4),
      (10, N'Hall Alpha', 120, 5),
      (11, N'Hall Beta', 120, 5),
      (12, N'Hall Gold', 120, 6),
      (13, N'Hall Silver', 120, 6);
      SET IDENTITY_INSERT Room OFF;
    `);
    console.log("- Da khoi tao cac Phong chieu cho ca 6 rap");

    // 4. Generate seats for these 13 rooms automatically in bulk to avoid timeout/slowness
    const roomCursorRes = await pool.request().query("SELECT RoomId FROM Room");
    const roomIds = roomCursorRes.recordset.map(r => r.RoomId);

    const alphabet = 'ABCDEFGHIJ';
    const seatInserts = [];
    
    for (const roomId of roomIds) {
      for (let r = 0; r < 10; r++) {
        const rowChar = alphabet[r];
        let seatType = 'Standard';
        if (rowChar === 'J') seatType = 'Sweetbox';
        else if (['F', 'G', 'H'].includes(rowChar)) seatType = 'VIP';
        
        for (let c = 1; c <= 12; c++) {
          const seatNumber = `${rowChar}${c}`;
          seatInserts.push(`(${roomId}, '${seatNumber}', N'${seatType}')`);
        }
      }
    }

    console.log(`- Dang sinh hang loat ${seatInserts.length} ghe cho 13 phong chieu...`);
    // Insert in chunks of 500
    for (let i = 0; i < seatInserts.length; i += 500) {
      const chunk = seatInserts.slice(i, i + 500);
      await pool.request().query(`
        INSERT INTO Seat (RoomId, SeatNumber, SeatType) VALUES ${chunk.join(',')}
      `);
    }
    console.log("- Da hoan thanh tao ghe");

    // 5. Seed the 25 showtimes with StartTime and EndTime calculated based on the movie durations
    const showtimeInserts = [];
    for (const st of showtimesToSeed) {
      const startTimeStr = `${st.date} ${st.time}:00`;
      const startDate = new Date(startTimeStr);
      
      // Look up movie duration from DB
      const movieRes = await pool.request()
        .input("movieId", sql.Int, st.movieId)
        .query("SELECT Duration FROM Movie WHERE MovieId = @movieId");
      const duration = movieRes.recordset[0]?.Duration || 120;
      const endDate = new Date(startDate.getTime() + duration * 60000);

      // Find RoomId by cinemaId and hallName
      const roomLookup = await pool.request()
        .input("cinemaId", sql.Int, st.cinemaId)
        .input("roomName", sql.NVarChar, st.hall)
        .query("SELECT RoomId FROM Room WHERE CinemaId = @cinemaId AND RoomName = @roomName");
      const roomId = roomLookup.recordset[0]?.RoomId;

      if (!roomId) {
        throw new Error(`RoomId not found for CinemaId ${st.cinemaId} and RoomName ${st.hall}`);
      }

      const formatSqlDate = (d) => {
        return d.toISOString().slice(0, 19).replace('T', ' ');
      };

      showtimeInserts.push(`(${st.id}, ${st.movieId}, ${roomId}, '${formatSqlDate(startDate)}', '${formatSqlDate(endDate)}', ${st.price})`);
    }

    if (showtimeInserts.length > 0) {
      await pool.request().query(`
        SET IDENTITY_INSERT Showtime ON;
        INSERT INTO Showtime (ShowtimeId, MovieId, RoomId, StartTime, EndTime, Price) VALUES ${showtimeInserts.join(',')};
        SET IDENTITY_INSERT Showtime OFF;
      `);
    }
    console.log("- Da nap thanh cong 25 Suat chieu thoi gian thuc trung khop hoan toan voi CSDL & Frontend!");

    // 6. Restore the transaction detail foreign key constraint
    await pool.request().query(`
      ALTER TABLE TicketDetail ADD CONSTRAINT FK_TicketDet__Showt__5DCAEF64 
      FOREIGN KEY (ShowtimeId) REFERENCES Showtime(ShowtimeId);
    `);

    // 7. Seed the test revenue ticket CNS_REVENUE_DEL
    await pool.request().query(`
      INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status) 
      VALUES ('CNS_REVENUE_DEL', 1, '${day0} 10:00:00', 1200000.00, N'Tiền mặt', 'nguyennhutrung788@gmail.com', N'valid');
      
      INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price) 
      VALUES ('CNS_REVENUE_DEL', 1, (SELECT TOP 1 SeatId FROM Seat WHERE RoomId = 1), 1200000.00);
    `);
    console.log("- Da khoi phuc ve mau 'CNS_REVENUE_DEL' cho ghe A1 tai Suat chieu 1!");

    await sql.close();
    console.log("\n====================================================================");
    console.log("             DONG BO HOA CSDL CINESTAR HOAN TAT THANH CONG!");
    console.log("====================================================================");
  } catch (err) {
    console.error("Loi khi chay seed:", err);
  }
}

seed();
