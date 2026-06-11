import { movies as staticMovies, showtimes as staticShowtimes } from "../data/movies";
import type { Movie, Showtime } from "../data/movies";

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
  status: 'valid' | 'used';
  userEmail: string | null;
  combos?: { name: string; quantity: number; price: number }[];
}

export function initializeDB() {
  if (!localStorage.getItem("movies_db")) {
    localStorage.setItem("movies_db", JSON.stringify(staticMovies));
  }
  if (!localStorage.getItem("showtimes_db")) {
    localStorage.setItem("showtimes_db", JSON.stringify(staticShowtimes));
  }
  if (!localStorage.getItem("tickets_db")) {
    localStorage.setItem("tickets_db", JSON.stringify([]));
  }
}

export function loadMovies(): Movie[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("movies_db") || "[]");
  } catch {
    return staticMovies;
  }
}

export function saveMovies(movies: Movie[]) {
  localStorage.setItem("movies_db", JSON.stringify(movies));
}

export function loadShowtimes(): Showtime[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("showtimes_db") || "[]");
  } catch {
    return staticShowtimes;
  }
}

export function saveShowtimes(showtimes: Showtime[]) {
  localStorage.setItem("showtimes_db", JSON.stringify(showtimes));
}

export function loadTickets(): BookedTicket[] {
  initializeDB();
  try {
    return JSON.parse(localStorage.getItem("tickets_db") || "[]");
  } catch {
    return [];
  }
}

export function saveTicket(ticket: BookedTicket) {
  const tickets = loadTickets();
  tickets.unshift(ticket); // Add new ticket to the beginning
  localStorage.setItem("tickets_db", JSON.stringify(tickets));
}

export function updateTicketStatus(id: string, status: 'valid' | 'used'): boolean {
  const tickets = loadTickets();
  const index = tickets.findIndex(t => t.id === id);
  if (index !== -1) {
    tickets[index].status = status;
    localStorage.setItem("tickets_db", JSON.stringify(tickets));
    return true;
  }
  return false;
}

export interface SeatLock {
  id: string;
  showtimeId: number;
  seatId: string;
  lockedAt: number;
  expiresAt: number;
  transactionId: string;
  status: 'pending' | 'sold';
}

export function initializeLocks() {
  if (!localStorage.getItem("seat_locks_db")) {
    localStorage.setItem("seat_locks_db", JSON.stringify([]));
  }
}

export function loadSeatLocks(): SeatLock[] {
  initializeLocks();
  try {
    const locks = JSON.parse(localStorage.getItem("seat_locks_db") || "[]") as SeatLock[];
    const now = Date.now();
    const validLocks = locks.filter(l => l.expiresAt > now);
    if (validLocks.length !== locks.length) {
      localStorage.setItem("seat_locks_db", JSON.stringify(validLocks));
    }
    return validLocks;
  } catch {
    return [];
  }
}

export function saveSeatLocks(locks: SeatLock[]) {
  localStorage.setItem("seat_locks_db", JSON.stringify(locks));
}

export function addSeatLock(
  showtimeId: number, 
  seatId: string, 
  transactionId: string, 
  status: 'pending' | 'sold' = 'pending', 
  durationMs: number = 600000
): SeatLock {
  const locks = loadSeatLocks();
  const now = Date.now();
  
  const filtered = locks.filter(l => !(l.showtimeId === showtimeId && l.seatId === seatId));
  
  const newLock: SeatLock = {
    id: Math.random().toString(36).substring(2, 9),
    showtimeId,
    seatId,
    lockedAt: now,
    expiresAt: now + durationMs,
    transactionId,
    status
  };
  
  filtered.push(newLock);
  saveSeatLocks(filtered);
  return newLock;
}

export function removeSeatLock(showtimeId: number, seatId: string) {
  const locks = loadSeatLocks();
  const filtered = locks.filter(l => !(l.showtimeId === showtimeId && l.seatId === seatId));
  saveSeatLocks(filtered);
}

export function clearSeatLocksForTransaction(transactionId: string) {
  const locks = loadSeatLocks();
  const filtered = locks.filter(l => l.transactionId !== transactionId);
  saveSeatLocks(filtered);
}

export function isSeatLocked(showtimeId: number, seatId: string, currentTxId?: string): boolean {
  const locks = loadSeatLocks();
  const now = Date.now();
  return locks.some(
    l => l.showtimeId === showtimeId && 
         l.seatId === seatId && 
         l.transactionId !== currentTxId && 
         l.expiresAt > now
  );
}

