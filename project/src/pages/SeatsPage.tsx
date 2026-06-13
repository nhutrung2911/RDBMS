import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Monitor, ChevronRight, Minus, Plus, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";
import type { Movie, Showtime } from "../data/movies";
import { cinemas, TICKET_PRICES } from "../data/movies";
import { 
  loadSeatLocks, loadTickets, isSeatLocked, addSeatLock, removeSeatLock
} from "../lib/db";

interface SeatsPageProps {
  movie: Movie;
  showtime: Showtime;
  onBack: () => void;
  onConfirm: (
    seats: string[], 
    total: number, 
    combos: { name: string; quantity: number; price: number }[]
  ) => void;
  concurrencyConfig?: any;
  addSqlLog?: (message: string, type?: 'info' | 'query' | 'lock' | 'success' | 'error') => void;
}

type SeatStatus = "available" | "selected" | "sold" | "vip" | "vip_selected" | "couple" | "couple_selected";

function generateSeats() {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const cols = 12;
  const soldPositions = new Set([
    "A3", "A4", "B7", "B8", "C2", "C5", "C6", "D10", "D11",
    "E1", "E2", "F4", "F5", "F6", "G8", "G9", "H3", "I7", "J2", "J3",
  ]);
  const vipRows = new Set(["F", "G", "H"]);
  const coupleRow = "J";

  const seats: Record<string, SeatStatus> = {};
  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      const key = `${row}${col}`;
      if (soldPositions.has(key)) {
        seats[key] = "sold";
      } else if (row === coupleRow) {
        seats[key] = col % 2 === 1 ? "couple" : "couple";
      } else if (vipRows.has(row)) {
        seats[key] = "vip";
      } else {
        seats[key] = "available";
      }
    }
  }
  return seats;
}

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard", "4dx": "4DX", imax: "IMAX", sweetbox: "Sweetbox",
};

const COMBOS = [
  { id: "solo", name: "Combo Solo", desc: "1 Bắp ngọt lớn + 1 Nước ngọt lớn", price: 60000, icon: "🍿" },
  { id: "double", name: "Combo Double", desc: "1 Bắp ngọt lớn + 2 Nước ngọt lớn", price: 85000, icon: "🥤" },
  { id: "party", name: "Combo Party", desc: "2 Bắp ngọt lớn + 4 Nước ngọt lớn", price: 150000, icon: "🎉" }
];

export default function SeatsPage({ movie, showtime, onBack, onConfirm, concurrencyConfig, addSqlLog }: SeatsPageProps) {
  const [seatMap, setSeatMap] = useState<Record<string, SeatStatus>>(generateSeats);
  const [selectedCombos, setSelectedCombos] = useState<Record<string, number>>({
    solo: 0,
    double: 0,
    party: 0
  });
  const [simState, setSimState] = useState<{
    isActive: boolean;
    message: string;
    stage: 'idle' | 'running' | 'blocked' | 'deadlock' | 'success' | 'error';
  }>({
    isActive: false,
    message: "",
    stage: 'idle'
  });

  // Merge locks from DB
  useEffect(() => {
    const locks = loadSeatLocks().filter(l => l.showtimeId === showtime.id);
    const tickets = loadTickets().filter(t => t.movieId === movie.id && t.showtimeTime === showtime.time && t.showtimeDate === showtime.date && t.hall === showtime.hall);
    
    // Get all sold seats from tickets
    const soldFromTickets = new Set<string>();
    tickets.forEach(t => t.seats.forEach(s => soldFromTickets.add(s)));
    
    setSeatMap(prev => {
      const next = { ...prev };
      // 1. Mark sold from tickets
      soldFromTickets.forEach(s => {
        next[s] = "sold";
      });
      
      // 2. Handle pending locks based on Dirty Read config
      locks.forEach(l => {
        if (l.status === 'sold') {
          next[l.seatId] = "sold";
        } else if (l.status === 'pending') {
          if (concurrencyConfig?.devModeEnabled && concurrencyConfig?.scenario === 'dirty_read') {
            if (concurrencyConfig.isolationLevel === 'READ_UNCOMMITTED') {
              next[l.seatId] = "sold"; 
            } else {
              next[l.seatId] = l.seatId.startsWith("J") ? "couple" : ["F","G","H"].includes(l.seatId[0]) ? "vip" : "available";
            }
          } else {
            next[l.seatId] = "sold";
          }
        }
      });
      return next;
    });
  }, [showtime.id, concurrencyConfig]);

  const handleProceedWithSimulation = async () => {
    if (selectedSeats.length === 0) return;
    const txId = "TX_" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const delay = concurrencyConfig.latencyMs || 1500;
    
    const combosList = Object.entries(selectedCombos)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const c = COMBOS.find(x => x.id === id)!;
        return { name: c.name, quantity: qty, price: c.price };
      });

    // 1. LOST UPDATE SCENARIO
    if (concurrencyConfig.scenario === "lost_update") {
      const seat = selectedSeats[0];
      setSimState({
        isActive: true,
        message: `Đang khởi tạo Giao dịch A (${txId}) đặt ghế ${seat}...`,
        stage: 'running'
      });
      
      if (addSqlLog) {
        addSqlLog(`--- KHỞI ĐẦU GIẢ LẬP LOST UPDATE ---`, "info");
        addSqlLog(`CLIENT A: SET TRANSACTION ISOLATION LEVEL READ COMMITTED;`, "query");
        addSqlLog(`CLIENT A: BEGIN TRANSACTION A (${txId});`, "query");
        if (concurrencyConfig.useLockFix) {
          addSqlLog(`CLIENT A: SELECT SeatStatus FROM Seat WITH (UPDLOCK, HOLDLOCK) WHERE SeatID = '${seat}' AND ShowtimeID = ${showtime.id};`, "lock");
          addSqlLog(`CLIENT A: Ghế '${seat}' đang trống. Khóa UPDLOCK đã được giữ trên dòng SeatID='${seat}'.`, "success");
        } else {
          addSqlLog(`CLIENT A: SELECT SeatStatus FROM Seat WHERE SeatID = '${seat}' AND ShowtimeID = ${showtime.id};`, "query");
          addSqlLog(`CLIENT A: Ghế '${seat}' đang trống. Không có khóa nào được giữ (SP cũ).`, "info");
        }
      }

      // Simultaneously trigger B after 400ms
      setTimeout(() => {
        const txBId = "TX_B_" + Math.random().toString(36).substring(2, 6).toUpperCase();
        if (addSqlLog) {
          addSqlLog(`CLIENT B: BEGIN TRANSACTION B (${txBId});`, "query");
          if (concurrencyConfig.useLockFix) {
            addSqlLog(`CLIENT B: SELECT SeatStatus FROM Seat WITH (UPDLOCK, HOLDLOCK) WHERE SeatID = '${seat}' AND ShowtimeID = ${showtime.id};`, "lock");
            addSqlLog(`CLIENT B: [BLOCKED] Đang đợi giải phóng khóa UPDLOCK trên dòng SeatID='${seat}'...`, "lock");
          } else {
            addSqlLog(`CLIENT B: SELECT SeatStatus FROM Seat WHERE SeatID = '${seat}' AND ShowtimeID = ${showtime.id};`, "query");
            addSqlLog(`CLIENT B: Ghế '${seat}' đang trống (Dirty/Uncommitted Read). CLIENT B chuẩn bị đặt đè.`, "info");
          }
        }

        if (concurrencyConfig.useLockFix) {
          setSimState(prev => ({
            ...prev,
            message: `Giao dịch B đang bị KHÓA CHỜ (Blocked) do Giao dịch A đang giữ khóa UPDLOCK trên ghế ${seat}...`,
            stage: 'blocked'
          }));
        }
      }, 400);

      // Wait for latency to complete A's transaction
      await new Promise(resolve => setTimeout(resolve, delay));

      // Lock seat in DB for A
      addSeatLock(showtime.id, seat, txId, 'sold');
      if (addSqlLog) {
        addSqlLog(`CLIENT A: UPDATE Seat SET SeatStatus = 'SOLD' WHERE SeatID = '${seat}';`, "query");
        addSqlLog(`CLIENT A: COMMIT TRANSACTION A;`, "success");
        addSqlLog(`CLIENT A: Đặt ghế '${seat}' thành công! Giải phóng khóa.`, "success");
      }

      // Check B's outcome
      if (concurrencyConfig.useLockFix) {
        // B wakes up, sees seat is sold, rollback
        if (addSqlLog) {
          addSqlLog(`CLIENT B: [RESUMED] Khóa được giải phóng. Đọc lại SeatStatus...`, "lock");
          addSqlLog(`CLIENT B: Ghế '${seat}' đã có trạng thái 'SOLD'.`, "error");
          addSqlLog(`CLIENT B: ROLLBACK TRANSACTION B;`, "error");
          addSqlLog(`CLIENT B: Đặt vé thất bại do ghế đã được mua!`, "error");
          addSqlLog(`--- KẾT THÚC GIẢ LẬP: TRÁNH ĐƯỢC LOST UPDATE ---`, "success");
        }
        setSimState({
          isActive: true,
          message: `Giao dịch A đặt vé thành công! Giao dịch B tự động ROLLBACK khi nhận thấy ghế ${seat} đã bị khóa bán.`,
          stage: 'success'
        });
        setTimeout(() => {
          setSimState(prev => ({ ...prev, isActive: false }));
          onConfirm(selectedSeats, overallTotalPrice, combosList);
        }, 3000);
      } else {
        // Lost update occurs - B overwrites or both write
        addSeatLock(showtime.id, seat, "TX_B_OVERWRITE", 'sold');
        if (addSqlLog) {
          addSqlLog(`CLIENT B: UPDATE Seat SET SeatStatus = 'SOLD' WHERE SeatID = '${seat}';`, "query");
          addSqlLog(`CLIENT B: COMMIT TRANSACTION B;`, "success");
          addSqlLog(`CLIENT B: Đặt ghế '${seat}' thành công (ghi đè A)!`, "success");
          addSqlLog(`[CẢNH BÁO] LOST UPDATE XẢY RA: Cả hai client đều ghi nhận thành công, nhưng vé của Client A đã bị mất dữ liệu cập nhật!`, "error");
          addSqlLog(`--- KẾT THÚC GIẢ LẬP: XẢY RA LỖI TRANH CHẤP ---`, "error");
        }
        setSimState({
          isActive: true,
          message: `LỖI XẢY RA! Cả 2 giao dịch A và B đều báo thành công. Ghế ${seat} bị bán trùng! (Mất dữ liệu cập nhật của A)`,
          stage: 'error'
        });
        setTimeout(() => {
          setSimState(prev => ({ ...prev, isActive: false }));
          onConfirm(selectedSeats, overallTotalPrice, combosList);
        }, 4000);
      }
    }

    // 2. DEADLOCK SCENARIO
    else if (concurrencyConfig.scenario === "deadlock" && selectedSeats.length >= 2) {
      const [seat1, seat2] = selectedSeats;
      setSimState({
        isActive: true,
        message: `Đang bắt đầu giao dịch đặt combo ghế {${seat1}, ${seat2}}...`,
        stage: 'running'
      });

      if (addSqlLog) {
        addSqlLog(`--- KHỞI ĐẦU GIẢ LẬP DEADLOCK ---`, "info");
        addSqlLog(`CLIENT A: BEGIN TRANSACTION A (${txId});`, "query");
      }

      if (concurrencyConfig.useLockFix) {
        const sorted = [...selectedSeats].sort();
        if (addSqlLog) {
          addSqlLog(`CLIENT A (Sửa lỗi): Tự động sắp xếp dãy ghế chọn: ${sorted.join(', ')}`, "success");
          addSqlLog(`CLIENT A: Khóa ghế đầu tiên '${sorted[0]}' trong danh sách...`, "lock");
        }
        
        addSeatLock(showtime.id, sorted[0], txId, 'pending');
        if (addSqlLog) {
          addSqlLog(`CLIENT A: Đã khóa '${sorted[0]}'.`, "success");
        }

        // B tries to lock
        setTimeout(() => {
          const txBId = "TX_B_" + Math.random().toString(36).substring(2, 6).toUpperCase();
          if (addSqlLog) {
            addSqlLog(`CLIENT B: BEGIN TRANSACTION B (${txBId});`, "query");
            addSqlLog(`CLIENT B: Tự động sắp xếp dãy ghế: ${sorted.join(', ')}`, "success");
            addSqlLog(`CLIENT B: Thử khóa ghế '${sorted[0]}' đầu tiên...`, "lock");
            addSqlLog(`CLIENT B: [BLOCKED] Ghế '${sorted[0]}' đang bị giữ bởi CLIENT A. Đang xếp hàng chờ...`, "lock");
          }
          setSimState(prev => ({
            ...prev,
            message: `Giao dịch B tự động xếp hàng chờ (Blocked) ở ghế ${sorted[0]} thay vì khóa chéo. Không có Deadlock!`,
            stage: 'blocked'
          }));
        }, 400);

        await new Promise(resolve => setTimeout(resolve, delay));

        // A locks seat 2
        addSeatLock(showtime.id, sorted[1], txId, 'pending');
        if (addSqlLog) {
          addSqlLog(`CLIENT A: Khóa tiếp ghế '${sorted[1]}'.`, "lock");
          addSqlLog(`CLIENT A: UPDATE Seat SET SeatStatus = 'SOLD' FOR BOTH; COMMIT;`, "query");
          addSqlLog(`CLIENT A: Hoàn tất đặt vé! Giao dịch A committed. Giải phóng khóa.`, "success");
        }

        // B resumes after A commits
        setTimeout(() => {
          if (addSqlLog) {
            addSqlLog(`CLIENT B: [RESUMED] Bắt đầu xử lý khóa.`, "lock");
            addSqlLog(`CLIENT B: Nhận thấy ghế '${sorted[0]}' đã bán. Tự động hủy và ROLLBACK.`, "error");
          }
        }, delay + 400);

        setSimState({
          isActive: true,
          message: `SỬA LỖI THÀNH CÔNG: Sắp xếp thứ tự khóa tránh được Deadlock. Giao dịch A đặt vé thành công, Giao dịch B chờ đợi và tự rollback an toàn.`,
          stage: 'success'
        });

        setTimeout(() => {
          setSimState(prev => ({ ...prev, isActive: false }));
          onConfirm(selectedSeats, overallTotalPrice, combosList);
        }, 3000);

      } else {
        // Client A locks seat 1
        addSeatLock(showtime.id, seat1, txId, 'pending');
        if (addSqlLog) {
          addSqlLog(`CLIENT A: Khóa thành công ghế '${seat1}'.`, "success");
        }

        // Client B locks seat 2 after 400ms
        const txBId = "TX_B_" + Math.random().toString(36).substring(2, 6).toUpperCase();
        setTimeout(() => {
          if (addSqlLog) {
            addSqlLog(`CLIENT B: BEGIN TRANSACTION B (${txBId});`, "query");
            addSqlLog(`CLIENT B: Khóa thành công ghế '${seat2}'.`, "success");
          }
          setSimState(prev => ({
            ...prev,
            message: `Giao dịch A đang giữ khóa ghế ${seat1}, Giao dịch B đang giữ khóa ghế ${seat2}...`,
            stage: 'blocked'
          }));
        }, 400);

        await new Promise(resolve => setTimeout(resolve, delay / 2));

        // Now A tries to lock seat 2 (held by B)
        if (addSqlLog) {
          addSqlLog(`CLIENT A: Yêu cầu khóa tiếp ghế '${seat2}'...`, "lock");
          addSqlLog(`CLIENT A: [BLOCKED] Đang chờ CLIENT B giải phóng ghế '${seat2}'...`, "lock");
        }

        // B tries to lock seat 1 (held by A)
        setTimeout(() => {
          if (addSqlLog) {
            addSqlLog(`CLIENT B: Yêu cầu khóa tiếp ghế '${seat1}'...`, "lock");
            addSqlLog(`CLIENT B: [BLOCKED] Đang chờ CLIENT A giải phóng ghế '${seat1}'...`, "lock");
            addSqlLog(`[DEADLOCK] !!! PHÁT HIỆN KHÓA CHẾT GIỮA TRAN A và TRAN B !!!`, "error");
            addSqlLog(`DATABASE ENGINE: Chọn TRANSACTION A làm nạn nhân (Deadlock Victim).`, "error");
            addSqlLog(`CLIENT A: Transaction A was deadlocked on lock resources with another process. SQL Error: 1205.`, "error");
            addSqlLog(`CLIENT A: ROLLBACK TRANSACTION A;`, "error");
            addSqlLog(`CLIENT B: [RESUMED] Khóa '${seat1}' được giải phóng. CLIENT B đặt vé thành công!`, "success");
            addSqlLog(`--- KẾT THÚC GIẢ LẬP: LỖI DEADLOCK 1205 ---`, "error");
          }
          
          setSimState({
            isActive: true,
            message: `LỖI KHÓA CHẾT (Deadlock 1205)! Giao dịch A bị Database hủy bỏ (Rollback) vì khóa chéo với Giao dịch B.`,
            stage: 'deadlock'
          });

          removeSeatLock(showtime.id, seat1);
          addSeatLock(showtime.id, seat1, txBId, 'sold');
          addSeatLock(showtime.id, seat2, txBId, 'sold');
        }, 600);

        setTimeout(() => {
          setSimState(prev => ({ ...prev, isActive: false }));
          window.location.reload();
        }, 4500);
      }
    }
    
    // 3. OTHER SCENARIOS / GUEST FLOW
    else {
      setSimState({
        isActive: true,
        message: `Đang bắt đầu giao dịch đặt vé (${txId})...`,
        stage: 'running'
      });
      if (addSqlLog) {
        addSqlLog(`CLIENT: BEGIN TRANSACTION (${txId});`, "query");
        selectedSeats.forEach(s => {
          addSqlLog(`CLIENT: SELECT SeatStatus FROM Seat WITH (UPDLOCK) WHERE SeatID = '${s}';`, "lock");
          addSeatLock(showtime.id, s, txId, 'pending', 600000);
        });
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (addSqlLog) {
        addSqlLog(`CLIENT: Transaction prepared. Proceeding to checkout.`, "success");
      }
      setSimState({ isActive: false, message: "", stage: 'idle' });
      onConfirm(selectedSeats, overallTotalPrice, combosList);
    }
  };
  const [showCombos, setShowCombos] = useState(false);

  const rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const cols = Array.from({ length: 12 }, (_, i) => i + 1);

  const cinema = cinemas.find((c) => c.id === showtime.cinemaId);
  const basePrice = TICKET_PRICES[showtime.type];
  const vipMultiplier = 1.3;
  const coupleMultiplier = 2.2;

  const selectedSeats = useMemo(
    () => Object.entries(seatMap).filter(([, s]) => s === "selected" || s === "vip_selected" || s === "couple_selected").map(([k]) => k),
    [seatMap]
  );

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => {
      const row = seat[0];
      if (["F", "G", "H"].includes(row)) return sum + basePrice * vipMultiplier;
      if (row === "J") return sum + basePrice * coupleMultiplier;
      return sum + basePrice;
    }, 0);
  }, [selectedSeats, basePrice]);

  const comboPrice = useMemo(() => {
    return Object.entries(selectedCombos).reduce((sum, [id, qty]) => {
      const c = COMBOS.find(x => x.id === id);
      return sum + (c ? c.price * qty : 0);
    }, 0);
  }, [selectedCombos]);

  const overallTotalPrice = totalPrice + comboPrice;

  const toggleSeat = (key: string) => {
    if (isSeatLocked(showtime.id, key)) {
      alert("Ghế này đang được khóa giao dịch bởi người dùng khác!");
      return;
    }
    setSeatMap((prev) => {
      const current = prev[key];
      if (current === "sold") return prev;
      const next: Record<SeatStatus, SeatStatus> = {
        available: "selected", selected: "available",
        vip: "vip_selected", vip_selected: "vip",
        couple: "couple_selected", couple_selected: "couple",
        sold: "sold",
      };
      return { ...prev, [key]: next[current] };
    });
  };

  const getSeatClass = (status: SeatStatus) => {
    const base = "w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg text-xs font-medium transition-all duration-200 border border-b-2 flex items-center justify-center cursor-pointer select-none";
    const styles: Record<SeatStatus, string> = {
      available: `${base} bg-slate-700 border-slate-500 border-b-slate-400 text-slate-300 hover:bg-slate-600 hover:scale-110 active:scale-95`,
      selected: `${base} bg-red-600 border-red-500 border-b-red-400 text-white scale-110 shadow-lg shadow-red-600/30`,
      sold: `${base} bg-zinc-800 border-zinc-700 border-b-zinc-700 text-zinc-600 cursor-not-allowed`,
      vip: `${base} bg-amber-700/70 border-amber-600 border-b-amber-500 text-amber-200 hover:bg-amber-600 hover:scale-110`,
      vip_selected: `${base} bg-amber-500 border-amber-400 border-b-amber-300 text-white scale-110 shadow-lg shadow-amber-500/30`,
      couple: `${base} bg-rose-800/60 border-rose-700 border-b-rose-600 text-rose-200 hover:bg-rose-700 hover:scale-110`,
      couple_selected: `${base} bg-rose-600 border-rose-500 border-b-rose-400 text-white scale-110 shadow-lg shadow-rose-600/30`,
    };
    return styles[status];
  };

  const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN").format(Math.round(price));

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 py-4 mt-16">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg leading-tight">{movie.titleVi || movie.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-0.5 flex-wrap">
              <span>{cinema?.name}</span>
              <span className="text-zinc-600">•</span>
              <span>{showtime.date}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-red-400 font-medium">{showtime.time}</span>
              <span className="text-zinc-600">•</span>
              <span className="bg-blue-900/40 text-blue-300 border border-blue-700 text-xs px-2 py-0.5 rounded">
                {TYPE_LABELS[showtime.type]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8 max-w-2xl mx-auto">
            {["Chọn ghế", "Thanh toán", "Hoàn tất"].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-500"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs font-medium flex-shrink-0 ${i === 0 ? "text-white" : "text-gray-500"}`}>{s}</span>
                {i < 2 && <div className="flex-1 h-px bg-zinc-800" />}
              </div>
            ))}
          </div>

          {/* Screen */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-full max-w-md h-3 bg-gradient-to-b from-red-500/40 to-transparent rounded-full mb-1" />
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
              <Monitor className="w-3 h-3" />
              Màn hình
            </div>
          </div>

          {/* Seat Map */}
          <div className="overflow-x-auto">
            <div className="flex flex-col gap-1.5 items-center min-w-fit">
              {rows.map((row) => (
                <div key={row} className="flex items-center gap-1.5">
                  <span className="w-5 text-center text-gray-600 text-xs font-mono flex-shrink-0">{row}</span>
                  <div className="flex gap-1.5">
                    {cols.map((col) => {
                      const key = `${row}${col}`;
                      const status = seatMap[key];
                      return (
                        <button
                          key={key}
                          onClick={() => toggleSeat(key)}
                          className={getSeatClass(status)}
                          title={key}
                          disabled={status === "sold"}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                  <span className="w-5 text-center text-gray-600 text-xs font-mono flex-shrink-0">{row}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 justify-center mt-8">
            {[
              { color: "bg-slate-700 border-slate-500 border-b-slate-400", label: `Thường (${formatPrice(basePrice)}đ)` },
              { color: "bg-amber-700/70 border-amber-600 border-b-amber-500", label: `VIP (${formatPrice(basePrice * 1.3)}đ)` },
              { color: "bg-rose-800/60 border-rose-700 border-b-rose-600", label: `Đôi (${formatPrice(basePrice * 2.2)}đ)` },
              { color: "bg-red-600 border-red-500 border-b-red-400", label: "Đã chọn" },
              { color: "bg-zinc-800 border-zinc-700", label: "Đã bán" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-t-lg border border-b-2 ${l.color}`} />
                <span className="text-gray-400 text-xs">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Combos Section (UML <<extend>> relationship) */}
          <div className="mt-12 border-t border-zinc-800 pt-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍿</span>
                <div>
                  <h4 className="text-white font-bold text-sm">Mua Thêm Combo Bắp & Nước? (Tùy Chọn)</h4>
                  <p className="text-gray-400 text-[11px] mt-0.5">Tiết kiệm đến 20% khi mua online cùng vé xem phim</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCombos(!showCombos);
                  if (showCombos) {
                    setSelectedCombos({ solo: 0, double: 0, party: 0 });
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                  showCombos 
                    ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-750" 
                    : "bg-red-600/10 text-red-400 border-red-650/20 hover:bg-red-600/20"
                }`}
              >
                {showCombos ? "Hủy chọn" : "Chọn thêm"}
              </button>
            </div>

            {showCombos && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {COMBOS.map((c) => (
                  <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center justify-between hover:border-zinc-700 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{c.icon}</span>
                      <div>
                        <h4 className="text-white font-bold text-sm">{c.name}</h4>
                        <p className="text-gray-550 text-[11px] mt-0.5">{c.desc}</p>
                        <p className="text-red-400 font-bold text-xs mt-2">{formatPrice(c.price)}đ</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                      <button
                        onClick={() => setSelectedCombos(prev => ({ ...prev, [c.id]: Math.max(0, prev[c.id] - 1) }))}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-white font-bold text-xs w-4 text-center">{selectedCombos[c.id]}</span>
                      <button
                        onClick={() => setSelectedCombos(prev => ({ ...prev, [c.id]: prev[c.id] + 1 }))}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            {selectedSeats.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 text-sm">Ghế đã chọn:</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedSeats.map((s) => (
                      <span key={s} className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-600/30">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">Tổng tiền:</span>
                  <span className="text-white font-bold text-lg">{formatPrice(overallTotalPrice)}đ</span>
                </div>
              </>
            ) : (
              <p className="text-gray-550 text-sm">Chọn ghế để tiếp tục đặt vé</p>
            )}
          </div>

          <button
            onClick={() => {
              if (selectedSeats.length === 0) return;
              
              if (concurrencyConfig?.devModeEnabled) {
                handleProceedWithSimulation();
              } else {
                // Normal flow without dev mode simulation
                const simulateCollision = Math.random() < 0.15;
                if (simulateCollision) {
                  const conflictedSeat = selectedSeats[Math.floor(Math.random() * selectedSeats.length)];
                  alert(`Rất tiếc, ghế ${conflictedSeat} vừa có người đặt trước đó vài giây. Vui lòng chọn ghế khác!`);
                  setSeatMap(prev => ({
                    ...prev,
                    [conflictedSeat]: "sold"
                  }));
                  return;
                }

                const combosList = Object.entries(selectedCombos)
                  .filter(([, qty]) => qty > 0)
                  .map(([id, qty]) => {
                    const c = COMBOS.find(x => x.id === id)!;
                    return { name: c.name, quantity: qty, price: c.price };
                  });
                onConfirm(selectedSeats, overallTotalPrice, combosList);
              }
            }}
            disabled={selectedSeats.length === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedSeats.length > 0
                ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 hover:shadow-red-600/40"
                : "bg-zinc-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            Tiếp Theo
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simulation Overlay Modal */}
      {simState.isActive && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in duration-200">
            <div className="flex items-center justify-center">
              {simState.stage === 'running' && (
                <div className="w-12 h-12 border-4 border-red-655/30 border-t-red-600 rounded-full animate-spin" />
              )}
              {simState.stage === 'blocked' && (
                <div className="w-12 h-12 border-4 border-amber-600/30 border-t-amber-500 rounded-full animate-spin" />
              )}
              {simState.stage === 'success' && (
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 animate-bounce" />
                </div>
              )}
              {simState.stage === 'deadlock' && (
                <div className="w-12 h-12 bg-red-655/20 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}
              {simState.stage === 'error' && (
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
              )}
            </div>
            
            <h3 className="text-white font-bold text-lg font-sans">
              {simState.stage === 'running' && "Đang thực thi Transaction..."}
              {simState.stage === 'blocked' && "Giao dịch BỊ KHÓA CHỜ (Blocked)"}
              {simState.stage === 'success' && "Đặt vé Thành Công!"}
              {simState.stage === 'deadlock' && "LỖI KHÓA CHẾT (Deadlock)"}
              {simState.stage === 'error' && "XUNG ĐỘT TƯƠNG TRANH!"}
            </h3>
            
            <p className="text-gray-400 text-xs leading-relaxed font-medium">
              {simState.message}
            </p>
            
            <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 text-[10px] text-zinc-500 font-mono text-left max-h-32 overflow-y-auto">
              <div>Mức cô lập: {concurrencyConfig?.isolationLevel}</div>
              <div>Độ trễ giả lập: {concurrencyConfig?.latencyMs}ms</div>
              {concurrencyConfig?.useLockFix && <div className="text-emerald-500 font-sans">Đã kích hoạt SP sửa lỗi.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
