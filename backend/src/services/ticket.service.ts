import { sql, connectDatabase, getMockMode } from "../config/database";

export interface BookedTicket {
  id: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  showtimeDate: string;
  showtimeTime: string;
  hall: string;
  seats: string[];
  totalPrice: number;
  paymentMethod: string;
  bookedAt: string;
  status: "valid" | "used";
  userEmail: string | null;
  combos?: { name: string; quantity: number; price: number }[];
}

export interface SeatLock {
  id: string;
  showtimeId: number;
  seatId: string;
  lockedAt: number;
  expiresAt: number;
  transactionId: string;
  status: "pending" | "sold";
}

// In-Memory Mock Database
export let mockTickets: BookedTicket[] = [];
export let mockSeatLocks: SeatLock[] = [];
export let mockShowtimes = [
  { id: 1, movieId: 1, cinemaId: 1, date: "2026-06-01", time: "09:30", hall: "Hall 1", type: "imax" as const, availableSeats: 45, totalSeats: 120 },
  { id: 2, movieId: 1, cinemaId: 1, date: "2026-06-01", time: "12:15", hall: "Hall 2", type: "standard" as const, availableSeats: 78, totalSeats: 100 },
  { id: 3, movieId: 1, cinemaId: 1, date: "2026-06-01", time: "15:00", hall: "Hall 3", type: "4dx" as const, availableSeats: 32, totalSeats: 80 },
  { id: 4, movieId: 1, cinemaId: 1, date: "2026-06-01", time: "18:30", hall: "Hall 1", type: "imax" as const, availableSeats: 15, totalSeats: 120 },
  { id: 5, movieId: 1, cinemaId: 1, date: "2026-06-01", time: "21:00", hall: "Hall 2", type: "standard" as const, availableSeats: 60, totalSeats: 100 },
];

export class TicketService {
  async getAllTickets(): Promise<BookedTicket[]> {
    if (getMockMode()) {
      return mockTickets;
    }

    const pool = await connectDatabase();
    if (!pool) return mockTickets;

    const result = await pool.request().query(`
      SELECT 
          t.TicketId AS TicketID,
          sh.MovieId AS MovieID,
          m.Title AS MovieTitle,
          m.Poster AS MoviePoster,
          c.CinemaName AS CinemaName,
          CONVERT(VARCHAR(10), sh.StartTime, 23) AS ShowtimeDate,
          CONVERT(VARCHAR(5), sh.StartTime, 108) AS ShowtimeTime,
          r.RoomName AS Hall,
          (
              SELECT SeatNumber + ','
              FROM TicketDetail td2
              JOIN Seat s2 ON td2.SeatId = s2.SeatId
              WHERE td2.TicketId = t.TicketId
              FOR XML PATH('')
          ) AS SeatsString,
          t.TotalPrice AS TotalPrice,
          t.PaymentMethod AS PaymentMethod,
          CONVERT(VARCHAR(16), t.BookingTime, 120) AS BookedAt,
          t.Status AS Status,
          t.UserEmail AS UserEmail
      FROM Ticket t
      LEFT JOIN TicketDetail td ON t.TicketId = td.TicketId
      LEFT JOIN Showtime sh ON td.ShowtimeId = sh.ShowtimeId
      LEFT JOIN Room r ON sh.RoomId = r.RoomId
      LEFT JOIN Cinema c ON r.CinemaId = c.CinemaId
      LEFT JOIN Movie m ON sh.MovieId = m.MovieId
      GROUP BY 
          t.TicketId, sh.MovieId, m.Title, m.Poster, c.CinemaName, 
          sh.StartTime, r.RoomName, t.TotalPrice, t.PaymentMethod, 
          t.BookingTime, t.Status, t.UserEmail
      ORDER BY t.BookingTime DESC
    `);
    
    return result.recordset.map(row => ({
      id: row.TicketID,
      movieId: row.MovieID || 1,
      movieTitle: row.MovieTitle || "Unknown Movie",
      moviePoster: row.MoviePoster || "",
      cinemaName: row.CinemaName || "",
      showtimeDate: row.ShowtimeDate || "",
      showtimeTime: row.ShowtimeTime || "",
      hall: row.Hall || "",
      seats: row.SeatsString ? row.SeatsString.split(',').filter(Boolean) : [],
      totalPrice: row.TotalPrice,
      paymentMethod: row.PaymentMethod,
      bookedAt: row.BookedAt,
      status: row.Status === 'valid' ? 'valid' : 'used',
      userEmail: row.UserEmail
    }));
  }

  async getShowtimes(): Promise<any[]> {
    if (getMockMode()) {
      return mockShowtimes;
    }

    const pool = await connectDatabase();
    if (!pool) return mockShowtimes;

    const result = await pool.request().query(`
      SELECT 
        st.ShowtimeId, st.MovieId, st.RoomId, st.StartTime, st.EndTime, st.Price,
        r.RoomName, r.CinemaId, r.Capacity,
        (SELECT COUNT(*) FROM Seat WHERE RoomId = st.RoomId) as TotalSeats,
        (
          (SELECT COUNT(*) FROM Seat WHERE RoomId = st.RoomId) - 
          (SELECT COUNT(*) FROM TicketDetail td JOIN Ticket t ON td.TicketId = t.TicketId WHERE td.ShowtimeId = st.ShowtimeId AND t.Status != N'canceled')
        ) as AvailableSeats
      FROM Showtime st
      JOIN Room r ON st.RoomId = r.RoomId
    `);

    return result.recordset.map(row => {
      // Handle local timezone offset to avoid date shifting
      const startTime = new Date(row.StartTime);
      const year = startTime.getFullYear();
      const month = String(startTime.getMonth() + 1).padStart(2, '0');
      const day = String(startTime.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = String(startTime.getHours()).padStart(2, '0') + ":" + String(startTime.getMinutes()).padStart(2, '0');
      
      return {
        id: row.ShowtimeId,
        movieId: row.MovieId,
        cinemaId: row.CinemaId,
        date: dateStr,
        time: timeStr,
        hall: row.RoomName,
        type: row.Price >= 150000 ? "4dx" : row.Price >= 130000 ? "imax" : "standard",
        availableSeats: row.AvailableSeats < 0 ? 0 : row.AvailableSeats,
        totalSeats: row.TotalSeats || 120
      };
    });
  }

  async createShowtime(st: any): Promise<any> {
    if (getMockMode()) {
      const newSt = { ...st, id: mockShowtimes.length + 1 };
      mockShowtimes.push(newSt);
      return newSt;
    }

    const pool = await connectDatabase();
    if (!pool) return null;

    // Get Movie Duration to calculate EndTime
    const movieRes = await pool.request()
      .input("movieId", sql.Int, st.movieId)
      .query("SELECT Duration FROM Movie WHERE MovieId = @movieId");
    const duration = movieRes.recordset[0]?.Duration || 120; // fallback to 120 mins

    const startTimeStr = `${st.date} ${st.time}:00`;
    const startDate = new Date(startTimeStr);
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Get RoomId from CinemaId and RoomName (st.hall)
    const roomRes = await pool.request()
      .input("cinemaId", sql.Int, st.cinemaId)
      .input("roomName", sql.VarChar, st.hall)
      .query("SELECT RoomId FROM Room WHERE CinemaId = @cinemaId AND RoomName = @roomName");
    let roomId = roomRes.recordset[0]?.RoomId;
    if (!roomId) {
      const fallbackRoom = await pool.request()
        .input("cinemaId", sql.Int, st.cinemaId)
        .query("SELECT TOP 1 RoomId FROM Room WHERE CinemaId = @cinemaId");
      roomId = fallbackRoom.recordset[0]?.RoomId || 1;
    }

    const price = st.price || 90000.00;

    const result = await pool.request()
      .input("movieId", sql.Int, st.movieId)
      .input("roomId", sql.Int, roomId)
      .input("startTime", sql.DateTime, startDate)
      .input("endTime", sql.DateTime, endDate)
      .input("price", sql.Decimal(18, 2), price)
      .query(`
        INSERT INTO Showtime (MovieId, RoomId, StartTime, EndTime, Price)
        OUTPUT INSERTED.*
        VALUES (@movieId, @roomId, @startTime, @endTime, @price)
      `);

    const inserted = result.recordset[0];
    return {
      id: inserted.ShowtimeId,
      movieId: inserted.MovieId,
      cinemaId: st.cinemaId,
      date: st.date,
      time: st.time,
      hall: st.hall,
      type: st.type,
      availableSeats: st.availableSeats,
      totalSeats: st.totalSeats
    };
  }

  async deleteShowtime(id: number): Promise<boolean> {
    if (getMockMode()) {
      const initialLength = mockShowtimes.length;
      mockShowtimes = mockShowtimes.filter(s => s.id !== id);
      return mockShowtimes.length < initialLength;
    }

    const pool = await connectDatabase();
    if (!pool) return false;

    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Showtime WHERE ShowtimeID = @id");
    return (result.rowsAffected[0] || 0) > 0;
  }

  async checkInTicket(id: string): Promise<boolean> {
    if (getMockMode()) {
      const ticket = mockTickets.find(t => t.id === id);
      if (ticket) {
        ticket.status = "used";
        return true;
      }
      return false;
    }

    const pool = await connectDatabase();
    if (!pool) return false;

    const result = await pool.request()
      .input("id", sql.VarChar, id)
      .query("UPDATE Ticket SET Status = 'used' WHERE TicketID = @id");
    return (result.rowsAffected[0] || 0) > 0;
  }

  // Dirty Read Locks Management
  async getLocks(): Promise<SeatLock[]> {
    const now = Date.now();
    mockSeatLocks = mockSeatLocks.filter(l => l.expiresAt > now);
    return mockSeatLocks;
  }

  async addLock(showtimeId: number, seatId: string, transactionId: string, status: "pending" | "sold" = "pending", durationMs = 600000): Promise<SeatLock> {
    const now = Date.now();
    mockSeatLocks = mockSeatLocks.filter(l => !(l.showtimeId === showtimeId && l.seatId === seatId));

    const newLock: SeatLock = {
      id: Math.random().toString(36).substring(2, 9),
      showtimeId,
      seatId,
      lockedAt: now,
      expiresAt: now + durationMs,
      transactionId,
      status
    };
    mockSeatLocks.push(newLock);
    return newLock;
  }

  async removeLock(showtimeId: number, seatId: string): Promise<void> {
    mockSeatLocks = mockSeatLocks.filter(l => !(l.showtimeId === showtimeId && l.seatId === seatId));
  }

  async clearLocksForTx(transactionId: string): Promise<void> {
    mockSeatLocks = mockSeatLocks.filter(l => l.transactionId !== transactionId);
  }

  // LOST UPDATE & DEADLOCK transactional booking simulation
  async bookTicket(params: {
    showtimeId: number;
    seats: string[];
    useLockFix: boolean;
    latencyMs: number;
    isolationLevel: sql.IIsolationLevel;
    userEmail: string | null;
    movieTitle: string;
    moviePoster: string;
    cinemaName: string;
    showtimeDate: string;
    showtimeTime: string;
    totalPrice: number;
    paymentMethod: string;
    combos?: any[];
  }): Promise<BookedTicket> {
    const {
      showtimeId, seats, useLockFix, latencyMs, isolationLevel,
      userEmail, movieTitle, moviePoster, cinemaName, showtimeDate, showtimeTime, totalPrice, paymentMethod, combos
    } = params;

    const transactionId = "TX_" + Math.random().toString(36).substring(2, 7).toUpperCase();

    // ==========================================
    // 1. MOCK MODE EXECUTION
    // ==========================================
    if (getMockMode()) {
      // Simulate transaction delay
      if (latencyMs > 0) {
        await new Promise(resolve => setTimeout(resolve, latencyMs));
      }

      // Check if any seat is already booked
      const alreadyBooked = mockTickets.some(t =>
        t.showtimeTime === showtimeTime &&
        t.showtimeDate === showtimeDate &&
        t.seats.some(s => seats.includes(s))
      );

      if (alreadyBooked) {
        throw new Error("Một hoặc nhiều ghế bạn chọn vừa mới có người đặt thành công. Vui lòng chọn ghế khác!");
      }

      const ticket: BookedTicket = {
        id: transactionId,
        movieId: 1, // default mock
        movieTitle,
        moviePoster,
        cinemaName,
        showtimeDate,
        showtimeTime,
        hall: "Hall 1",
        seats,
        totalPrice,
        paymentMethod,
        bookedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "valid",
        userEmail,
        combos
      };

      mockTickets.unshift(ticket);

      // Update showtime seats
      const showtimeObj = mockShowtimes.find(s => s.id === showtimeId);
      if (showtimeObj) {
        showtimeObj.availableSeats = Math.max(0, showtimeObj.availableSeats - seats.length);
      }

      return ticket;
    }

    // ==========================================
    // 2. REAL DATABASE TRANSACTIONAL EXECUTION
    // ==========================================
    const pool = await connectDatabase();
    if (!pool) {
      throw new Error("Không thể kết nối cơ sở dữ liệu.");
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin(isolationLevel);

    try {
      // Check for seats locks/availability using query statements with UPDLOCK/HOLDLOCK on physical Seat table
      const lockHint = useLockFix ? "WITH (UPDLOCK, HOLDLOCK)" : "";

      // DEADLOCK prevention: If fix is enabled, sort the seats list alphabetically
      const orderedSeats = useLockFix ? [...seats].sort() : seats;

      for (const seat of orderedSeats) {
        // Step 2.1: Lock the static physical seat row first
        await transaction.request()
          .input("showtimeId", sql.Int, showtimeId)
          .input("seatNumber", sql.VarChar, seat)
          .query(`
            SELECT SeatId FROM Seat ${lockHint} 
            WHERE SeatNumber = @seatNumber AND RoomId = (SELECT RoomId FROM Showtime WHERE ShowtimeId = @showtimeId)
          `);

        // Step 2.2: Query the view to check if it's already sold (No hint on the complex view)
        const seatCheck = await transaction.request()
          .input("showtimeId", sql.Int, showtimeId)
          .input("seatNumber", sql.VarChar, seat)
          .query(`
            SELECT Status FROM v_ShowtimeSeats 
            WHERE SeatNumber = @seatNumber AND ShowtimeId = @showtimeId
          `);

        const seatStatus = seatCheck.recordset[0]?.Status;
        if (seatStatus === "sold" || seatStatus === "SOLD") {
          throw new Error(`Ghế ${seat} đã bị bán trước đó. Giao dịch thất bại!`);
        }
      }

      // Simulate Latency (transaction stays open, locks are held)
      if (latencyMs > 0) {
        await new Promise(resolve => setTimeout(resolve, latencyMs));
      }

      // Insert Ticket invoice into database (using matching physical schema)
      const ticketId = "CNS" + Math.random().toString(36).substring(2, 7).toUpperCase();
      // Default to customer ID 1 or a lookup
      await transaction.request()
        .input("ticketId", sql.VarChar, ticketId)
        .input("customerId", sql.Int, 1) // default customer ID
        .input("totalPrice", sql.Decimal(18,2), totalPrice)
        .input("paymentMethod", sql.NVarChar, paymentMethod)
        .input("userEmail", sql.VarChar, userEmail)
        .query(`
          INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status)
          VALUES (@ticketId, @customerId, GETDATE(), @totalPrice, @paymentMethod, @userEmail, N'valid')
        `);

      // Insert seat tickets into TicketDetail (instead of trying to UPDATE Seat Status)
      const pricePerSeat = totalPrice / seats.length;
      for (const seat of seats) {
        await transaction.request()
          .input("ticketId", sql.VarChar, ticketId)
          .input("showtimeId", sql.Int, showtimeId)
          .input("seatNumber", sql.VarChar, seat)
          .input("price", sql.Decimal(18,2), pricePerSeat)
          .query(`
            INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price)
            VALUES (
              @ticketId, 
              @showtimeId, 
              (SELECT SeatId FROM Seat WHERE SeatNumber = @seatNumber AND RoomId = (SELECT RoomId FROM Showtime WHERE ShowtimeId = @showtimeId)), 
              @price
            )
          `);
      }

      // Update showtime seats counter
      await transaction.request()
        .input("showtimeId", sql.Int, showtimeId)
        .input("seatCount", sql.Int, seats.length)
        .query(`
          UPDATE Showtime 
          SET Price = Price -- No AvailableSeats column in Showtime table, so this is a placeholder or safe operation
          WHERE ShowtimeID = @showtimeId
        `);

      await transaction.commit();

      const ticket: BookedTicket = {
        id: ticketId,
        movieId: 1,
        movieTitle,
        moviePoster,
        cinemaName,
        showtimeDate,
        showtimeTime,
        hall: "Hall 1",
        seats,
        totalPrice,
        paymentMethod,
        bookedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        status: "valid",
        userEmail,
        combos
      };

      return ticket;
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        // Suppress warning if transaction was already aborted/rolled back by SQL Server
      }
      throw err;
    }
  }
}

export const ticketService = new TicketService();
