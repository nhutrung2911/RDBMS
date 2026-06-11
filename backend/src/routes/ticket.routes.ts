import { Router } from "express";
import { concurrencyMiddleware } from "../middlewares/concurrency";
import { 
  getAllTickets, getShowtimes, createShowtime, deleteShowtime,
  checkInTicket, getLocks, addLock, removeLock, clearLocks, bookTicket 
} from "../controllers/ticket.controller";

const router = Router();

// Set concurrency config parser for transactional operations
router.use(concurrencyMiddleware as any);

router.get("/", getAllTickets as any);
router.post("/book", bookTicket as any);
router.post("/check-in", checkInTicket as any);

router.get("/showtimes", getShowtimes as any);
router.post("/showtimes", createShowtime as any);
router.delete("/showtimes/:id", deleteShowtime as any);

router.get("/locks", getLocks as any);
router.post("/locks", addLock as any);
router.post("/locks/remove", removeLock as any);
router.delete("/locks/tx/:txId", clearLocks as any);

export default router;
