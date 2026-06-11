import { Router } from "express";
import { concurrencyMiddleware } from "../middlewares/concurrency";
import { getRevenueReport } from "../controllers/report.controller";

const router = Router();

// Apply concurrency middleware to parse headers
router.use(concurrencyMiddleware as any);

router.get("/revenue", getRevenueReport as any);

export default router;
