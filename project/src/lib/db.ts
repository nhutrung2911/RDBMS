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
  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const day0 = getLocalDateString(0); // Today

  if (!localStorage.getItem("movies_db")) {
    localStorage.setItem("movies_db", JSON.stringify(staticMovies));
  } else {
    // Sync movie release dates and merge any newly added static movies (with self-healing for ID collisions)
    try {
      let storedMovies = JSON.parse(localStorage.getItem("movies_db") || "[]") as Movie[];
      
      // Filter out stored movies with IDs <= 8 that don't match the title of the static movie (collisions)
      storedMovies = storedMovies.filter((m) => {
        const staticM = staticMovies.find((sm) => sm.id === m.id);
        if (staticM) {
          return staticM.title === m.title;
        }
        return true;
      });

      const updatedMovies = storedMovies.map((m: any) => {
        const staticMovie = staticMovies.find((sm) => sm.id === m.id);
        if (staticMovie) {
          return { ...m, releaseDate: staticMovie.releaseDate };
        }
        return m;
      });
      const missingStaticMovies = staticMovies.filter(
        (sm) => !storedMovies.some((m) => m.id === sm.id)
      );
      localStorage.setItem("movies_db", JSON.stringify([...updatedMovies, ...missingStaticMovies]));
    } catch (e) {
      localStorage.setItem("movies_db", JSON.stringify(staticMovies));
    }
  }

  // Always sync showtime dates with dynamic dates (day0, day1, day2) and merge missing static showtimes (with self-healing for ID collisions)
  let showtimes = staticShowtimes;
  const storedShowtimesStr = localStorage.getItem("showtimes_db");
  if (storedShowtimesStr) {
    try {
      let parsed = JSON.parse(storedShowtimesStr) as Showtime[];
      
      // Filter out parsed showtimes with IDs <= 17 that don't match the static showtime's movieId (collisions)
      parsed = parsed.filter((s) => {
        const staticSt = staticShowtimes.find((st) => st.id === s.id);
        if (staticSt) {
          return staticSt.movieId === s.movieId;
        }
        return true;
      });

      const updatedExisting = parsed.map((s: any) => {
        const staticSt = staticShowtimes.find((st) => st.id === s.id);
        if (staticSt) {
          return {
            ...s,
            date: staticSt.date
          };
        } else {
          return {
            ...s,
            date: s.date && s.date.includes("-") ? s.date : day0
          };
        }
      });
      const missingStatic = staticShowtimes.filter(
        (st) => !parsed.some((s) => s.id === st.id)
      );
      showtimes = [...updatedExisting, ...missingStatic];
    } catch {
      showtimes = staticShowtimes;
    }
  }
  localStorage.setItem("showtimes_db", JSON.stringify(showtimes));

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

export interface RoomConfig {
  id: string;
  name: string;
  cinemaId: number;
  rows: number;
  cols: number;
  seats: Record<string, 'standard' | 'vip' | 'couple'>;
}

export interface SeatPricingConfig {
  vipMultiplier: number;
  coupleMultiplier: number;
}

export function loadRooms(): RoomConfig[] {
  const stored = localStorage.getItem("rooms_db");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Continue to seed
    }
  }

  // Seed default rooms if not present
  const defaultRooms: RoomConfig[] = [];
  const defaultHallsByCinema = [
    { cinemaId: 1, halls: ["Hall 1", "Hall 2", "Hall 3"] },
    { cinemaId: 2, halls: ["Hall A", "Hall B"] },
    { cinemaId: 3, halls: ["Hall X", "Hall Y"] }
  ];

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const rowsCount = 10;
  const colsCount = 12;

  defaultHallsByCinema.forEach((item, cIdx) => {
    item.halls.forEach((hallName, hIdx) => {
      const seatsMap: Record<string, 'standard' | 'vip' | 'couple'> = {};
      for (let r = 0; r < rowsCount; r++) {
        const rowLetter = alphabet[r];
        for (let c = 1; c <= colsCount; c++) {
          const seatId = `${rowLetter}${c}`;
          if (rowLetter === "J") {
            seatsMap[seatId] = "couple";
          } else if (["F", "G", "H"].includes(rowLetter)) {
            seatsMap[seatId] = "vip";
          } else {
            seatsMap[seatId] = "standard";
          }
        }
      }

      defaultRooms.push({
        id: `room-c${item.cinemaId}-${hIdx + 1}`,
        name: hallName,
        cinemaId: item.cinemaId,
        rows: rowsCount,
        cols: colsCount,
        seats: seatsMap
      });
    });
  });

  localStorage.setItem("rooms_db", JSON.stringify(defaultRooms));
  return defaultRooms;
}

export function saveRooms(rooms: RoomConfig[]) {
  localStorage.setItem("rooms_db", JSON.stringify(rooms));
}

export function loadSeatPricing(): SeatPricingConfig {
  const stored = localStorage.getItem("seat_pricing_db");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  const defaultPricing = { vipMultiplier: 1.3, coupleMultiplier: 2.2 };
  localStorage.setItem("seat_pricing_db", JSON.stringify(defaultPricing));
  return defaultPricing;
}

export function saveSeatPricing(pricing: SeatPricingConfig) {
  localStorage.setItem("seat_pricing_db", JSON.stringify(pricing));
}


