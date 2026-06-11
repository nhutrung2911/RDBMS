import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Express Error Handler caught:", err);

  const statusCode = err.statusCode || 500;
  
  // Check if it is a SQL Server deadlock error (Error Code 1205)
  if (err.number === 1205 || (err.message && err.message.toLowerCase().includes("deadlock"))) {
    return res.status(409).json({
      success: false,
      error: "deadlock",
      errorCode: 1205,
      message: "LỖI KHÓA CHẾT (Deadlock 1205): Giao dịch bị chọn làm nạn nhân (Deadlock Victim) do tranh chấp tài nguyên khóa chéo.",
      sqlMessage: err.message
    });
  }

  // Check if it is a general SQL Server error (like double booking violation)
  if (err.number) {
    return res.status(400).json({
      success: false,
      error: "sql_error",
      errorCode: err.number,
      message: `Lỗi cơ sở dữ liệu SQL Server: ${err.message}`,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: err.name || "InternalServerError",
    message: err.message || "Đã xảy ra lỗi hệ thống trên máy chủ.",
  });
}
