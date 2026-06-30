import { sql, connectDatabase, getMockMode } from "../config/database";
import { mockTickets, BookedTicket } from "./ticket.service";

export interface ReportRow {
  label: string;
  ticketsCount: number;
  revenue: number;
}

export class ReportService {
  async getRevenueReport(params: {
    startDate: string;
    endDate: string;
    reportType: "date" | "cinema" | "movie";
    latencyMs: number;
    isolationLevel: sql.IIsolationLevel;
  }): Promise<{ read1: number; read2: number; data: ReportRow[] }> {
    const { startDate, endDate, reportType, latencyMs, isolationLevel } = params;

    // ==========================================
    // 1. MOCK MODE EXECUTION
    // ==========================================
    if (getMockMode()) {
      // 1. First Read
      const initialTickets = mockTickets.filter(t => {
        const ticketDate = t.bookedAt.substring(0, 10);
        return ticketDate >= startDate && ticketDate <= endDate;
      });
      const read1 = initialTickets.reduce((sum, t) => sum + t.totalPrice, 0);

      // 2. Wait
      if (latencyMs > 0) {
        await new Promise(resolve => setTimeout(resolve, latencyMs));
      }

      // 3. Second Read (Simulating background update if isolation is low)
      let read2 = read1;
      const isLowIsolation = 
        isolationLevel === sql.ISOLATION_LEVEL.READ_UNCOMMITTED || 
        isolationLevel === sql.ISOLATION_LEVEL.READ_COMMITTED;

      if (isLowIsolation && latencyMs > 0 && mockTickets.length > 0) {
        // Mock a background deletion of 1,200,000 VND
        read2 = Math.max(0, read1 - 1200000);
      }

      // 4. Calculate Grouped Report Data based on final state
      const finalTickets = mockTickets.filter(t => {
        const ticketDate = t.bookedAt.substring(0, 10);
        return ticketDate >= startDate && ticketDate <= endDate;
      });

      const groups: Record<string, { label: string; revenue: number; ticketsCount: number }> = {};
      finalTickets.forEach(t => {
        let label = "";
        if (reportType === "date") label = t.bookedAt.substring(0, 10);
        else if (reportType === "cinema") label = t.cinemaName;
        else if (reportType === "movie") label = t.movieTitle;

        if (!groups[label]) {
          groups[label] = { label, revenue: 0, ticketsCount: 0 };
        }
        groups[label].revenue += t.totalPrice;
        groups[label].ticketsCount += t.seats.length;
      });

      const data = Object.values(groups);
      if (isLowIsolation && latencyMs > 0 && data.length > 0) {
        data[0].revenue = Math.max(0, data[0].revenue - 1200000);
      }

      return { read1, read2, data };
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
      // Client A Read 1
      const check1 = await transaction.request()
        .input("start", sql.VarChar, startDate + " 00:00:00")
        .input("end", sql.VarChar, endDate + " 23:59:59")
        .query(`
          SELECT SUM(TotalPrice) as Total FROM Ticket 
          WHERE BookingTime BETWEEN @start AND @end AND Status != N'canceled'
        `);
      const read1 = check1.recordset[0]?.Total || 0;

      // Trigger background writer Transaction B after 400ms in separate connection pool
      let backgroundWriterFinished = false;
      setTimeout(async () => {
        try {
          const writerPool = await connectDatabase();
          if (writerPool) {
            // Transaction B attempts to delete/modify a record (like deleting a ticket with CNS_REVENUE_DEL ID)
            // If Repeatable Read or Serializable is set, this query will be BLOCKED until Transaction A commits.
            await writerPool.request().query(`
              DELETE FROM Ticket WHERE TicketId = 'CNS_REVENUE_DEL'
            `);
            backgroundWriterFinished = true;
          }
        } catch (err) {
          // Ignore writer blocking errors
        }
      }, 400);

      // Wait for latency
      if (latencyMs > 0) {
        await new Promise(resolve => setTimeout(resolve, latencyMs));
      }

      // Client A Read 2
      const check2 = await transaction.request()
        .input("start", sql.VarChar, startDate + " 00:00:00")
        .input("end", sql.VarChar, endDate + " 23:59:59")
        .query(`
          SELECT SUM(TotalPrice) as Total FROM Ticket 
          WHERE BookingTime BETWEEN @start AND @end AND Status != N'canceled'
        `);
      const read2 = check2.recordset[0]?.Total || 0;

      // Load report group items with proper relational joins
      let labelSelect = "CONVERT(VARCHAR(10), t.BookingTime, 23)";
      let joinSql = "";
      let groupBy = "CONVERT(VARCHAR(10), t.BookingTime, 23)";

      if (reportType === "cinema") {
        labelSelect = "c.CinemaName";
        joinSql = `
          LEFT JOIN TicketDetail td ON t.TicketId = td.TicketId
          LEFT JOIN Showtime sh ON td.ShowtimeId = sh.ShowtimeId
          LEFT JOIN Room r ON sh.RoomId = r.RoomId
          LEFT JOIN Cinema c ON r.CinemaId = c.CinemaId
        `;
        groupBy = "c.CinemaName";
      } else if (reportType === "movie") {
        labelSelect = "m.Title";
        joinSql = `
          LEFT JOIN TicketDetail td ON t.TicketId = td.TicketId
          LEFT JOIN Showtime sh ON td.ShowtimeId = sh.ShowtimeId
          LEFT JOIN Movie m ON sh.MovieId = m.MovieId
        `;
        groupBy = "m.Title";
      }

      const groupQuery = await transaction.request()
        .input("start", sql.VarChar, startDate + " 00:00:00")
        .input("end", sql.VarChar, endDate + " 23:59:59")
        .query(`
          SELECT 
            ${labelSelect} as Label,
            SUM(t.TotalPrice) as Revenue,
            COUNT(DISTINCT t.TicketId) as TicketsCount
          FROM Ticket t
          ${joinSql}
          WHERE t.BookingTime BETWEEN @start AND @end AND t.Status != N'canceled'
          GROUP BY ${groupBy}
        `);

      const data: ReportRow[] = groupQuery.recordset.map(row => ({
        label: row.Label || "N/A",
        revenue: row.Revenue || 0,
        ticketsCount: row.TicketsCount || 0
      }));

      await transaction.commit();

      return { read1, read2, data };
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

export const reportService = new ReportService();
