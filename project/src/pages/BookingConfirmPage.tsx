import { useState, useEffect } from "react";
import { CheckCircle, Download, Home, Ticket, Clock, MapPin, Film, CreditCard, Smartphone, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import type { Movie, Showtime } from "../data/movies";
import { cinemas } from "../data/movies";
import { 
  saveTicket, loadShowtimes, saveShowtimes, addSeatLock, 
  clearSeatLocksForTransaction 
} from "../lib/db";

interface BookingConfirmPageProps {
  movie: Movie;
  showtime: Showtime;
  selectedSeats: string[];
  selectedCombos?: { name: string; quantity: number; price: number }[];
  total: number;
  userEmail: string | null;
  onHome: () => void;
  onBack: () => void;
  concurrencyConfig?: any;
  addSqlLog?: (message: string, type?: 'info' | 'query' | 'lock' | 'success' | 'error') => void;
}

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard", "4dx": "4DX", imax: "IMAX", sweetbox: "Sweetbox",
};

const PAYMENT_METHODS = [
  { id: "momo", icon: "💜", label: "MoMo" },
  { id: "vnpay", icon: "🔵", label: "VNPay" },
  { id: "card", icon: <CreditCard className="w-4 h-4" />, label: "Thẻ ngân hàng" },
  { id: "zalopay", icon: "🟦", label: "ZaloPay" },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(n));
}

function BookingTicket({ movie, showtime, seats, total, bookingCode, selectedCombos, onHome }: {
  movie: Movie; showtime: Showtime; seats: string[]; total: number; bookingCode: string; selectedCombos?: { name: string; quantity: number; price: number }[]; onHome: () => void;
}) {
  const cinema = cinemas.find((c) => c.id === showtime.cinemaId);
  const combosPrice = selectedCombos ? selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0) : 0;
  const ticketsPrice = total - combosPrice;

  return (
    <div className="max-w-lg mx-auto">
      {/* Success Banner */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <CheckCircle className="w-9 h-9 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Đặt Vé Thành Công!</h1>
        <p className="text-gray-400 text-sm">Mã đặt vé của bạn là <span className="text-white font-mono font-bold">{bookingCode}</span></p>
      </div>

      {/* Ticket Card */}
      <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl mb-6">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 p-5 flex items-center gap-4">
          <img src={movie.poster} alt={movie.title} className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">{movie.titleVi || movie.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded font-medium">
                {TYPE_LABELS[showtime.type]}
              </span>
              <span className="text-white/70 text-xs">{movie.rating}</span>
            </div>
          </div>
        </div>

        {/* Dashed divider */}
        <div className="relative">
          <div className="absolute left-0 w-5 h-5 bg-zinc-950 rounded-full -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute right-0 w-5 h-5 bg-zinc-950 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="border-t border-dashed border-zinc-700 mx-6" />
        </div>

        {/* Ticket Body */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-4 mb-5">
            <InfoItem icon={<MapPin className="w-4 h-4 text-red-400" />} label="Rạp" value={cinema?.name || ""} subValue={cinema?.address} />
            <InfoItem icon={<Clock className="w-4 h-4 text-red-400" />} label="Suất chiếu" value={showtime.time} subValue={showtime.date} />
            <InfoItem icon={<Film className="w-4 h-4 text-red-400" />} label="Phòng chiếu" value={showtime.hall} />
            <InfoItem icon={<Ticket className="w-4 h-4 text-red-400" />} label="Ghế" value={seats.join(", ")} />
          </div>

          {/* Dashed divider */}
          <div className="relative mb-5">
            <div className="absolute left-0 w-4 h-4 bg-zinc-950 rounded-full -translate-y-1/2 -translate-x-5" />
            <div className="absolute right-0 w-4 h-4 bg-zinc-950 rounded-full -translate-y-1/2 translate-x-5" />
            <div className="border-t border-dashed border-zinc-700" />
          </div>

          {/* Pricing */}
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{seats.length} x Vé xem phim</span>
              <span className="text-gray-300">{formatPrice(ticketsPrice)}đ</span>
            </div>
            {selectedCombos && selectedCombos.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-400">{c.quantity} x {c.name}</span>
                <span className="text-gray-300">{formatPrice(c.price * c.quantity)}đ</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Phí dịch vụ</span>
              <span className="text-gray-300">0đ</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t border-zinc-700">
              <span className="text-white">Tổng cộng</span>
              <span className="text-red-400 text-lg">{formatPrice(total)}đ</span>
            </div>
          </div>

          {/* QR Code placeholder */}
          <div className="flex flex-col items-center py-4 bg-white rounded-xl">
            <div className="w-28 h-28 bg-zinc-900 rounded-lg flex items-center justify-center mb-2 relative">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${bookingCode}`} 
                alt="QR Code" 
                className="w-full h-full object-contain p-1 bg-white rounded"
              />
            </div>
            <p className="text-zinc-500 text-xs">{bookingCode}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 py-3 rounded-xl font-medium text-sm transition-colors">
          <Download className="w-4 h-4" />
          Tải Vé
        </button>
        <button
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-medium text-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          Về Trang Chủ
        </button>
      </div>
    </div>
  );
}

function QRPayment({ 
  total, 
  bookingCode, 
  method, 
  timeLeft, 
  onConfirm, 
  onCancel 
}: {
  total: number;
  bookingCode: string;
  method: string;
  timeLeft: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [checkSuccess, setCheckSuccess] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getMethodDetails = () => {
    switch (method) {
      case "momo":
        return {
          name: "Ví MoMo",
          color: "bg-pink-600 border-pink-500",
          textColor: "text-pink-400",
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=momo://transfer?phone=0901234567%26amount=${total}%26note=CNS%20${bookingCode}`
        };
      case "zalopay":
        return {
          name: "Ví ZaloPay",
          color: "bg-blue-600 border-blue-500",
          textColor: "text-blue-400",
          qrUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=zalopay://transfer?amount=${total}%26note=CNS%20${bookingCode}`
        };
      case "vnpay":
        return {
          name: "VNPay QR",
          color: "bg-blue-800 border-blue-700",
          textColor: "text-blue-500",
          qrUrl: `https://img.vietqr.io/image/vietinbank-1133224455-compact2.png?amount=${total}&addInfo=CNS%20${bookingCode}&accountName=CINESTAR%20VIETNAM`
        };
      default:
        return {
          name: "Ngân hàng (VietQR)",
          color: "bg-zinc-800 border-zinc-700",
          textColor: "text-red-400",
          qrUrl: `https://img.vietqr.io/image/vietinbank-1133224455-compact2.png?amount=${total}&addInfo=CNS%20${bookingCode}&accountName=CINESTAR%20VIETNAM`
        };
    }
  };

  const details = getMethodDetails();

  const handleConfirmClick = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setCheckSuccess(true);
      setTimeout(() => {
        onConfirm();
      }, 1200);
    }, 2200);
  };

  return (
    <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center shadow-2xl">
      {checking ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mb-6" />
          <h3 className="text-white font-bold text-lg mb-2">Đang đối soát giao dịch...</h3>
          <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
            Hệ thống đang kiểm tra thanh toán của bạn. Quá trình này có thể mất vài giây.
          </p>
        </div>
      ) : checkSuccess ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-400 animate-bounce" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Thanh toán thành công!</h3>
          <p className="text-gray-400 text-sm">Giao dịch đã được ghi nhận. Đang xuất vé...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <h2 className="text-white font-bold text-xl mb-1">Thanh Toán Trực Tuyến</h2>
          <p className="text-gray-400 text-xs mb-6">Vui lòng quét mã QR bên dưới để hoàn tất</p>

          {/* Alert Time Limit */}
          <div className="bg-red-950/20 border border-red-500/20 text-red-400 py-2.5 px-4 rounded-xl mb-6 flex items-center justify-between text-sm">
            <span className="font-semibold text-xs uppercase font-sans">Thời gian thanh toán còn lại</span>
            <span className="font-bold font-mono text-base">{formatTime(timeLeft)}</span>
          </div>

          {/* QR Code Frame */}
          <div className="bg-white p-5 rounded-2xl inline-block shadow-lg mb-5 relative overflow-hidden">
            <img 
              src={details.qrUrl} 
              alt="Payment QR Code" 
              className="w-56 h-56 object-contain"
            />
            {/* Visual scanline scanning simulation */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 opacity-60 animate-pulse" />
          </div>

          {/* Order Summary details */}
          <div className="bg-zinc-950/50 rounded-xl p-4 text-left border border-zinc-800 text-xs mb-6 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Cổng thanh toán:</span>
              <span className="text-white font-bold">{details.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền cần quét:</span>
              <span className={`font-bold text-sm ${details.textColor}`}>{new Intl.NumberFormat("vi-VN").format(total)}đ</span>
            </div>
            <div className="flex justify-between border-t border-zinc-850 pt-2.5">
              <span className="text-gray-500">Nội dung chuyển khoản:</span>
              <span className="text-white font-mono font-bold">CNS {bookingCode}</span>
            </div>
          </div>

          {/* Info note */}
          <p className="text-gray-500 text-[11px] leading-relaxed mb-6">
            Lưu ý: Quét đúng số tiền và nhập đúng nội dung chuyển khoản ở trên để vé được kích hoạt tự động.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleConfirmClick}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
              Tôi Đã Thanh Toán Thành Công
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium py-2.5 rounded-xl transition-all text-sm"
            >
              Hủy và Chọn lại phương thức thanh toán
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value, subValue }: { icon: React.ReactNode; label: string; value: string; subValue?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
        {icon}
        {label}
      </div>
      <p className="text-white font-semibold text-sm">{value}</p>
      {subValue && <p className="text-gray-500 text-xs mt-0.5">{subValue}</p>}
    </div>
  );
}

export default function BookingConfirmPage({ 
  movie, showtime, selectedSeats, selectedCombos = [], total, userEmail, onHome, onBack,
  concurrencyConfig, addSqlLog 
}: BookingConfirmPageProps) {
  const [step, setStep] = useState<"payment" | "qr_payment" | "success">("payment");
  const [selectedMethod, setSelectedMethod] = useState("momo");
  const [processing, setProcessing] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [bookingCode] = useState(() => "CNS" + Math.random().toString(36).substring(2, 8).toUpperCase());

  const cinema = cinemas.find((c) => c.id === showtime.cinemaId);

  // Lock seats on mount for Dirty Read simulation
  useEffect(() => {
    if (concurrencyConfig?.devModeEnabled) {
      if (addSqlLog) {
        addSqlLog(`--- KHỞI ĐẦU GIẢ LẬP DIRTY READ ---`, "info");
        addSqlLog(`CLIENT A: BEGIN TRANSACTION (TX_${bookingCode});`, "query");
        selectedSeats.forEach(seat => {
          addSqlLog(`CLIENT A: INSERT INTO SeatLock (SeatID, ShowtimeID, TransactionID, Status) VALUES ('${seat}', ${showtime.id}, 'TX_${bookingCode}', 'pending');`, "lock");
          addSeatLock(showtime.id, seat, `TX_${bookingCode}`, 'pending', 600000); // 10 min lock
        });
        addSqlLog(`CLIENT A: Giao dịch đang giữ các khóa độc quyền trên ghế và chưa COMMIT.`, "lock");
        addSqlLog(`[HƯỚNG DẪN] Mở màn hình Đặt vé ở một tab khác (hoặc ẩn danh) để xem ghế tạm giữ.`, "info");
      }
    } else {
      selectedSeats.forEach(seat => {
        addSeatLock(showtime.id, seat, `TX_${bookingCode}`, 'pending', 600000);
      });
    }

    return () => {
      // Cleanup handled by states
    };
  }, []);

  const handleCancelAndBack = () => {
    if (concurrencyConfig?.devModeEnabled && addSqlLog) {
      addSqlLog(`CLIENT A: Người dùng click 'Quay lại' hoặc hủy giao dịch.`, "info");
      addSqlLog(`CLIENT A: ROLLBACK TRANSACTION (TX_${bookingCode});`, "error");
      addSqlLog(`CLIENT A: Giải phóng các khóa tạm giữ. Ghế trống trở lại.`, "error");
      addSqlLog(`--- KẾT THÚC GIẢ LẬP DIRTY READ (ROLLBACK) ---`, "info");
    }
    clearSeatLocksForTransaction(`TX_${bookingCode}`);
    onBack();
  };

  useEffect(() => {
    if (step === "success") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (concurrencyConfig?.devModeEnabled && addSqlLog) {
            addSqlLog(`CLIENT A: Hết thời gian thanh toán (10 phút).`, "info");
            addSqlLog(`CLIENT A: ROLLBACK TRANSACTION (TX_${bookingCode});`, "error");
            addSqlLog(`CLIENT A: Giải phóng các khóa tạm giữ. Ghế trống trở lại.`, "error");
            addSqlLog(`--- KẾT THÚC GIẢ LẬP DIRTY READ (TIMED OUT) ---`, "info");
          }
          clearSeatLocksForTransaction(`TX_${bookingCode}`);
          alert("Hết thời gian giữ ghế! Đơn hàng của bạn đã bị hủy.");
          onHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, onHome]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setStep("qr_payment");
    }, 1000);
  };

  const handleConfirmPayment = () => {
    if (concurrencyConfig?.devModeEnabled && addSqlLog) {
      addSqlLog(`CLIENT A: Người dùng hoàn tất thanh toán.`, "info");
      addSqlLog(`CLIENT A: UPDATE Seat SET SeatStatus = 'SOLD' WHERE SeatID IN (${selectedSeats.map(s => `'${s}'`).join(', ')});`, "query");
      addSqlLog(`CLIENT A: COMMIT TRANSACTION (TX_${bookingCode});`, "success");
      addSqlLog(`CLIENT A: Vé đã được bán thành công. Giải phóng khóa tạm giữ.`, "success");
      addSqlLog(`--- KẾT THÚC GIẢ LẬP DIRTY READ (COMMIT) ---`, "success");
    }
    
    clearSeatLocksForTransaction(`TX_${bookingCode}`);

    // Create new ticket to save
    const newTicket = {
      id: bookingCode,
      movieId: movie.id,
      movieTitle: movie.titleVi || movie.title,
      moviePoster: movie.poster,
      cinemaName: cinema?.name || "CineStar Cinema",
      showtimeDate: showtime.date,
      showtimeTime: showtime.time,
      hall: showtime.hall,
      seats: selectedSeats,
      totalPrice: total,
      paymentMethod: selectedMethod === "momo"
        ? "Ví điện tử MoMo"
        : selectedMethod === "vnpay"
        ? "VNPay"
        : selectedMethod === "zalopay"
        ? "ZaloPay"
        : "Thẻ ngân hàng",
      bookedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "valid" as const,
      userEmail: userEmail,
      combos: selectedCombos
    };

    // Save ticket to local db
    saveTicket(newTicket);

    // Decrement showtime's seats
    const currentShowtimes = loadShowtimes();
    const idx = currentShowtimes.findIndex(s => s.id === showtime.id);
    if (idx !== -1) {
      currentShowtimes[idx].availableSeats = Math.max(0, currentShowtimes[idx].availableSeats - selectedSeats.length);
      saveShowtimes(currentShowtimes);
    }

    setStep("success");
  };

  const combosPrice = selectedCombos.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  const ticketsPrice = total - combosPrice;

  if (step === "success") {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
        <BookingTicket movie={movie} showtime={showtime} seats={selectedSeats} total={total} bookingCode={bookingCode} selectedCombos={selectedCombos} onHome={onHome} />
      </div>
    );
  }

  if (step === "qr_payment") {
    return (
      <div className="min-h-screen bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
        <QRPayment
          total={total}
          bookingCode={bookingCode}
          method={selectedMethod}
          timeLeft={timeLeft}
          onConfirm={handleConfirmPayment}
          onCancel={() => setStep("payment")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={handleCancelAndBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors py-2 px-3 hover:bg-white/5 rounded-lg text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại chọn ghế
          </button>
        </div>
        
        {/* Countdown Timer Banner */}
        <div className="bg-red-955/20 border border-red-500/20 text-red-400 p-4 rounded-xl mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider font-sans">Thời gian giữ ghế còn lại</span>
          </div>
          <span className="text-lg font-bold font-mono tracking-wider">{formatTime(timeLeft)}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {["Chọn ghế", "Thanh toán", "Hoàn tất"].map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 1 ? "bg-red-600 text-white" : i < 1 ? "bg-green-600 text-white" : "bg-zinc-800 text-gray-500"}`}>
                {i < 1 ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium flex-shrink-0 ${i === 1 ? "text-white" : "text-gray-500"}`}>{s}</span>
              {i < 2 && <div className={`flex-1 h-px ${i < 1 ? "bg-green-600" : "bg-zinc-800"}`} />}
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 mb-5 overflow-hidden">
          <button
            onClick={() => setShowOrderSummary((v) => !v)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
          >
            <span className="text-white font-semibold">Thông tin đặt vé</span>
            {showOrderSummary ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showOrderSummary && (
            <div className="px-4 pb-4 border-t border-zinc-800">
              <div className="flex gap-4 py-4">
                <img src={movie.poster} alt={movie.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold">{movie.titleVi || movie.title}</h3>
                  <div className="text-gray-400 text-sm mt-1 space-y-1">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {cinema?.name}</p>
                    <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {showtime.date} - {showtime.time}</p>
                    <p className="flex items-center gap-1.5"><Ticket className="w-3 h-3" /> Ghế: {selectedSeats.join(", ")}</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-zinc-850 pt-3 space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>{selectedSeats.length} x Vé xem phim</span>
                  <span>{formatPrice(ticketsPrice)}đ</span>
                </div>
                {selectedCombos.map((c, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{c.quantity} x {c.name}</span>
                    <span>{formatPrice(c.price * c.quantity)}đ</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Tổng cộng</span>
                <span className="text-white font-bold">{formatPrice(total)}đ</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-5">
          <h2 className="text-white font-semibold mb-4">Phương thức thanh toán</h2>
          <div className="grid grid-cols-2 gap-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMethod(m.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedMethod === m.id
                    ? "border-red-500 bg-red-600/10 text-white"
                    : "border-zinc-700 bg-zinc-800/50 text-gray-400 hover:border-zinc-600"
                  }`}
              >
                <span className="text-xl">{typeof m.icon === "string" ? m.icon : m.icon}</span>
                <span className="text-sm font-medium">{m.label}</span>
                {selectedMethod === m.id && (
                  <div className="ml-auto w-4 h-4 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Button */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Tổng thanh toán</span>
            <span className="text-white font-bold text-xl">{formatPrice(total)}đ</span>
          </div>
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-wait text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-red-600/20"
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Smartphone className="w-5 h-5" />
                Thanh Toán Ngay
              </>
            )}
          </button>
          <p className="text-gray-600 text-xs text-center mt-3">
            Bằng cách thanh toán, bạn đồng ý với Điều khoản dịch vụ của CineStar
          </p>
        </div>
      </div>
    </div>
  );
}
