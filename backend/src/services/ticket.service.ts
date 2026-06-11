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

    const result = await pool.request().query("SELECT * FROM Ticket ORDER BY BookedAt DESC");
    return result.recordset.map(row => ({
      id: row.TicketID,
      movieId: row.MovieID,
      movieTitle: row.MovieTitle,
      moviePoster: row.MoviePoster,
      cinemaName: row.CinemaName,
      showtimeDate: row.ShowtimeDate,
      showtimeTime: row.ShowtimeTime,
      hall: row.Hall,
      seats: JSON.parse(row.Seats || "[]"),
      totalPrice: row.TotalPrice,
      paymentMethod: row.PaymentMethod,
      bookedAt: row.BookedAt,
      status: row.Status,
      userEmail: row.UserEmail
    }));
  }

  async getShowtimes(): Promise<any[]> {
    if (getMockMode()) {
      return mockShowtimes;
    }

    const pool = await connectDatabase();
    if (!pool) return mockShowtimes;

    const result = await pool.request().query("SELECT * FROM Showtime");
    return result.recordset;
  }

  async createShowtime(st: any): Promise<any> {
    if (getMockMode()) {
      const newSt = { ...st, id: mockShowtimes.length + 1 };
      mockShowtimes.push(newSt);
      return newSt;
    }

    const pool = await connectDatabase();
    if (!pool) return null;

    const result = await pool.request()
      .input("movieId", sql.Int, st.movieId)
      .input("cinemaId", sql.Int, st.cinemaId)
      .input("date", sql.VarChar, st.date)
      .input("time", sql.VarChar, st.time)
      .input("hall", sql.VarChar, st.hall)
      .input("type", sql.VarChar, st.type)
      .input("availableSeats", sql.Int, st.availableSeats)
      .input("totalSeats", sql.Int, st.totalSeats)
      .query(`
        INSERT INTO Showtime (MovieID, CinemaID, Date, Time, Hall, Type, AvailableSeats, TotalSeats)
        OUTPUT INSERTED.*
        VALUES (@movieId, @cinemaId, @date, @time, @hall, @type, @availableSeats, @totalSeats)
      `);
    return result.recordset[0];
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
      // Check for seats locks/availability using query statements with UPDLOCK/HOLDLOCK depending on fix configuration
      const lockHint = useLockFix ? "WITH (UPDLOCK, HOLDLOCK)" : "";

      // DEADLOCK prevention: If fix is enabled, sort the seats list alphabetically
      const orderedSeats = useLockFix ? [...seats].sort() : seats;

      for (const seat of orderedSeats) {
        // Query to check if the seat status is sold
        const seatCheck = await transaction.request()
          .input("showtimeId", sql.Int, showtimeId)
          .input("seatId", sql.VarChar, seat)
          .query(`
            SELECT Status FROM Seat ${lockHint} 
            WHERE SeatID = @seatId AND ShowtimeID = @showtimeId
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

      // Perform Updates to set seats status to sold
      for (const seat of seats) {
        await transaction.request()
          .input("showtimeId", sql.Int, showtimeId)
          .input("seatId", sql.VarChar, seat)
          .query(`
            UPDATE Seat SET Status = 'SOLD' 
            WHERE SeatID = @seatId AND ShowtimeID = @showtimeId
          `);
      }

      // Insert Ticket invoice
      const ticketId = "CNS" + Math.random().toString(36).substring(2, 7).toUpperCase();
      await transaction.request()
        .input("ticketId", sql.VarChar, ticketId)
        .input("movieId", sql.Int, 1) // default mapped id
        .input("movieTitle", sql.NVarChar, movieTitle)
        .input("moviePoster", sql.VarChar, moviePoster)
        .input("cinemaName", sql.NVarChar, cinemaName)
        .input("showtimeDate", sql.VarChar, showtimeDate)
        .input("showtimeTime", sql.VarChar, showtimeTime)
        .input("hall", sql.VarChar, "Hall 1")
        .input("seatsJson", sql.VarChar, JSON.stringify(seats))
        .input("totalPrice", sql.Int, totalPrice)
        .input("paymentMethod", sql.NVarChar, paymentMethod)
        .input("bookedAt", sql.VarChar, new Date().toISOString().replace("T", " ").substring(0, 16))
        .input("status", sql.VarChar, "valid")
        .input("userEmail", sql.VarChar, userEmail)
        .query(`
          INSERT INTO Ticket (TicketID, MovieID, MovieTitle, MoviePoster, CinemaName, ShowtimeDate, ShowtimeTime, Hall, Seats, TotalPrice, PaymentMethod, BookedAt, Status, UserEmail)
          VALUES (@ticketId, @movieId, @movieTitle, @moviePoster, @cinemaName, @showtimeDate, @showtimeTime, @hall, @seatsJson, @totalPrice, @paymentMethod, @bookedAt, @status, @userEmail)
        `);

      // Update showtime seats counter
      await transaction.request()
        .input("showtimeId", sql.Int, showtimeId)
        .input("seatCount", sql.Int, seats.length)
        .query(`
          UPDATE Showtime 
          SET AvailableSeats = CASE WHEN AvailableSeats >= @seatCount THEN AvailableSeats - @seatCount ELSE 0 END 
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
      await transaction.rollback();
      throw err;
    }
  }
}

export const ticketService = new TicketService();
