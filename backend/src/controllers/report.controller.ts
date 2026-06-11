import { Response, NextFunction } from "express";
import { ConcurrencyRequest } from "../middlewares/concurrency";
import { reportService } from "../services/report.service";

export async function getRevenueReport(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const startDate = (req.query.startDate || new Date().toISOString().split("T")[0]) as string;
    const endDate = (req.query.endDate || new Date().toISOString().split("T")[0]) as string;
    const reportType = (req.query.reportType || "date") as "date" | "cinema" | "movie";
    
    const latencyMs = req.latencyMs || 0;
    const isolationLevel = req.isolationLevel!;

    const report = await reportService.getRevenueReport({
      startDate,
      endDate,
      reportType,
      latencyMs,
      isolationLevel
    });

    res.json({
      success: true,
      read1: report.read1,
      read2: report.read2,
      data: report.data
    });
  } catch (error) {
    next(error);
  }
}
