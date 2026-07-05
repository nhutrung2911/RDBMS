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
    useLockFix?: boolean;
  }): Promise<{ read1: number; read2: number; data: ReportRow[] }> {
    const { startDate, endDate, reportType, latencyMs, isolationLevel, useLockFix } = params;

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
        isolationLevel === sql.ISOLATION_LEVEL.READ_COMMITTED ||
        useLockFix; // If useLockFix (TO) is enabled, we allow the background update

      if (isLowIsolation && latencyMs > 0 && mockTickets.length > 0) {
        // Mock a background deletion of 1,200,000 VND
        read2 = Math.max(0, read1 - 1200000);
      }

      // If Timestamp Ordering (useLockFix) is active, detect write conflict and abort/rollback
      if (useLockFix && read1 !== read2) {
        throw new Error("LỖI XUNG ĐỘT NHÃN THỜI GIAN (Timestamp Ordering): Giao tác T1 (Older) phát hiện dữ liệu đã bị ghi đè bởi giao tác T2 (Younger). Giao tác T1 bị ROLLBACK!");
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

    // Tự động khôi phục hoặc tạo mới vé mẫu CNS_REVENUE_DEL trước khi chạy giả lập báo cáo doanh thu tương tranh
    if (latencyMs > 0) {
      try {
        await pool.request().query(`
          IF NOT EXISTS (SELECT 1 FROM Ticket WHERE TicketId = 'CNS_REVENUE_DEL')
          BEGIN
            INSERT INTO Ticket (TicketId, CustomerId, BookingTime, TotalPrice, PaymentMethod, UserEmail, Status) 
            VALUES ('CNS_REVENUE_DEL', 1, DATEADD(hour, -2, GETDATE()), 1200000.00, N'Tiền mặt', 'nguyennhutrung788@gmail.com', N'valid');
            
            INSERT INTO TicketDetail (TicketId, ShowtimeId, SeatId, Price) 
            VALUES ('CNS_REVENUE_DEL', 1, (SELECT TOP 1 SeatId FROM Seat WHERE RoomId = 1), 1200000.00);
          END
          ELSE
          BEGIN
            UPDATE Ticket SET Status = N'valid' WHERE TicketId = 'CNS_REVENUE_DEL';
          END
        `);
      } catch (err) {
        console.error("Lỗi tự động khôi phục/tạo mới vé mẫu:", err);
      }
    }

    const transaction = new sql.Transaction(pool);
    // Giao thức nhãn thời gian (Timestamp Ordering) cho phép giao dịch chèn/xoá xen vào dưới READ COMMITTED, sau đó kiểm tra để huỷ bỏ giao tác cũ
    const actualIsolation = useLockFix ? sql.ISOLATION_LEVEL.READ_COMMITTED : isolationLevel;
    await transaction.begin(actualIsolation);

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
      if (latencyMs > 0) {
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
      }

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

      if (useLockFix && read1 !== read2) {
        throw new Error("LỖI XUNG ĐỘT NHÃN THỜI GIAN (Timestamp Ordering): Giao tác T1 (Older) phát hiện dữ liệu đã bị ghi đè bởi giao tác T2 (Younger). Giao tác T1 bị ROLLBACK!");
      }

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
