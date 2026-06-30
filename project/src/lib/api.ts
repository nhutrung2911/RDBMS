const BASE_URL = "http://localhost:5000/api";

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}

export interface BookTicketParams {
  showtimeId: number;
  seats: string[];
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  showtimeDate: string;
  showtimeTime: string;
  totalPrice: number;
  paymentMethod: string;
  combos?: any[];
  userEmail: string | null;
  isolationLevel: string;
  useLockFix: boolean;
  latencyMs: number;
}

export async function bookTicketAPI(params: BookTicketParams) {
  const { isolationLevel, useLockFix, latencyMs, ...body } = params;
  
  const res = await fetch(`${BASE_URL}/tickets/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-isolation-level": isolationLevel,
      "x-use-lock-fix": String(useLockFix),
      "x-latency-ms": String(latencyMs)
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Giao dịch đặt vé thất bại!");
  }
  return data;
}

export interface RevenueReportParams {
  startDate: string;
  endDate: string;
  reportType: "date" | "cinema" | "movie";
  isolationLevel: string;
  useLockFix: boolean;
  latencyMs: number;
}

export async function getRevenueReportAPI(params: RevenueReportParams) {
  const { startDate, endDate, reportType, isolationLevel, useLockFix, latencyMs } = params;
  const query = new URLSearchParams({ startDate, endDate, reportType });

  const res = await fetch(`${BASE_URL}/reports/revenue?${query.toString()}`, {
    method: "GET",
    headers: {
      "x-isolation-level": isolationLevel,
      "x-use-lock-fix": String(useLockFix),
      "x-latency-ms": String(latencyMs)
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Tải báo cáo doanh thu thất bại!");
  }
  return data;
}

export async function getShowtimesAPI() {
  const res = await fetch(`${BASE_URL}/tickets/showtimes`);
  if (!res.ok) {
    throw new Error("Không thể tải danh sách suất chiếu từ SQL Server");
  }
  return res.json();
}

export async function getTicketsAPI() {
  const res = await fetch(`${BASE_URL}/tickets`);
  if (!res.ok) {
    throw new Error("Không thể tải danh sách vé từ SQL Server");
  }
  return res.json();
}

export async function checkInTicketAPI(id: string) {
  const res = await fetch(`${BASE_URL}/tickets/check-in`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Không thể thực hiện check-in vé trên SQL Server");
  }
  return data;
}
