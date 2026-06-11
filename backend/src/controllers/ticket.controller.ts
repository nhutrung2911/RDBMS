import { Response, NextFunction } from "express";
import { ConcurrencyRequest } from "../middlewares/concurrency";
import { ticketService } from "../services/ticket.service";

export async function getAllTickets(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const tickets = await ticketService.getAllTickets();
    res.json(tickets);
  } catch (error) {
    next(error);
  }
}

export async function getShowtimes(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const showtimes = await ticketService.getShowtimes();
    res.json(showtimes);
  } catch (error) {
    next(error);
  }
}

export async function createShowtime(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const newShowtime = await ticketService.createShowtime(req.body);
    res.status(201).json(newShowtime);
  } catch (error) {
    next(error);
  }
}

export async function deleteShowtime(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const success = await ticketService.deleteShowtime(id);
    res.json({ success });
  } catch (error) {
    next(error);
  }
}

export async function checkInTicket(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.body;
    const success = await ticketService.checkInTicket(id);
    res.json({ success });
  } catch (error) {
    next(error);
  }
}

export async function getLocks(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const locks = await ticketService.getLocks();
    res.json(locks);
  } catch (error) {
    next(error);
  }
}

export async function addLock(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const { showtimeId, seatId, transactionId, status, durationMs } = req.body;
    const lock = await ticketService.addLock(showtimeId, seatId, transactionId, status, durationMs);
    res.status(201).json(lock);
  } catch (error) {
    next(error);
  }
}

export async function removeLock(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const { showtimeId, seatId } = req.body;
    await ticketService.removeLock(showtimeId, seatId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function clearLocks(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const { txId } = req.params;
    await ticketService.clearLocksForTx(txId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function bookTicket(req: ConcurrencyRequest, res: Response, next: NextFunction) {
  try {
    const { 
      showtimeId, seats, movieTitle, moviePoster, cinemaName, 
      showtimeDate, showtimeTime, totalPrice, paymentMethod, combos, userEmail 
    } = req.body;

    const useLockFix = req.useLockFix || false;
    const latencyMs = req.latencyMs || 0;
    const isolationLevel = req.isolationLevel!;

    const ticket = await ticketService.bookTicket({
      showtimeId,
      seats,
      useLockFix,
      latencyMs,
      isolationLevel,
      userEmail,
      movieTitle,
      moviePoster,
      cinemaName,
      showtimeDate,
      showtimeTime,
      totalPrice,
      paymentMethod,
      combos
    });

    res.json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
}
