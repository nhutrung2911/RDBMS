import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import SeatsPage from "./pages/SeatsPage";
import BookingConfirmPage from "./pages/BookingConfirmPage";
import AuthPage from "./pages/AuthPage";
import UserProfilePage from "./pages/UserProfilePage";
import AdminPortalPage from "./pages/AdminPortalPage";
import type { Movie, Showtime } from "./data/movies";
import { supabase } from "./lib/supabase";
import { loadTickets, syncWithBackend } from "./lib/db";
import type { BookedTicket } from "./lib/db";
import { Ticket } from "lucide-react";
import DevPanel from "./components/DevPanel";
import type { ConcurrencyConfig, SqlLog } from "./components/DevPanel";

type Page = "home" | "coming_soon" | "movie_detail" | "seats" | "booking_confirm" | "my_tickets" | "auth" | "profile" | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [authSubMode, setAuthSubMode] = useState<"login" | "signup" | "forgot_password" | "reset_password">("login");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [detailScrollToShowtimes, setDetailScrollToShowtimes] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [bookedCombos, setBookedCombos] = useState<{ name: string; quantity: number; price: number }[]>([]);
  const [bookingTotal, setBookingTotal] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<"customer" | "admin" | null>(null);
  const [loading, setLoading] = useState(true);

  // Concurrency Simulation States
  const [concurrencyConfig, setConcurrencyConfig] = useState<ConcurrencyConfig>({
    devModeEnabled: false,
    scenario: "none",
    isolationLevel: "READ_COMMITTED",
    useLockFix: false,
    latencyMs: 5000
  });
  const [sqlLogs, setSqlLogs] = useState<SqlLog[]>([]);

  const addSqlLog = (message: string, type: SqlLog["type"] = "info") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    const newLog: SqlLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      message,
      type
    };
    setSqlLogs(prev => {
      const next = [...prev, newLog];
      if (next.length > 80) next.shift(); // Cap logs
      return next;
    });
  };

  useEffect(() => {
    syncWithBackend();
  }, [page]);

  useEffect(() => {
    let subscription: any = null;

    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          setUserEmail(data.session.user.email);
          setUserRole(data.session.user.user_metadata?.role || "customer");
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setLoading(false);
      }
    };

    try {
      checkAuth();

      const res = supabase.auth.onAuthStateChange((event: any, session: any) => {
        setUserEmail(session?.user?.email || null);
        setUserRole(session?.user?.user_metadata?.role || null);
        if (event === 'PASSWORD_RECOVERY') {
          setPage("auth");
          setAuthSubMode("reset_password");
        }
      });

      subscription = res?.data?.subscription || res?.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {
          console.error("Error unsubscribing:", e);
        }
      }
    };
  }, []);

  const navigate = (target: string) => {
    if (
      target === "home" || target === "coming_soon" || 
      target === "my_tickets" || target === "auth" || target === "profile" || target === "admin"
    ) {
      setPage(target as Page);
      setSelectedMovie(null);
      setSelectedShowtime(null);
      setDetailScrollToShowtimes(false);
      if (target === "auth") {
        setAuthSubMode("login");
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleMovieClick = (movie: Movie, scrollToShowtimes = false) => {
    setSelectedMovie(movie);
    setDetailScrollToShowtimes(scrollToShowtimes);
    setPage("movie_detail");
    if (!scrollToShowtimes) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== "" && page !== "home" && page !== "coming_soon") {
      setPage("home");
    }
  };

  const handleSelectShowtime = (showtime: Showtime, movie: Movie) => {
    setSelectedShowtime(showtime);
    setSelectedMovie(movie);
    setPage("seats");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirmSeats = (
    seats: string[], 
    total: number, 
    combos: { name: string; quantity: number; price: number }[]
  ) => {
    setBookedSeats(seats);
    setBookingTotal(total);
    setBookedCombos(combos);
    setPage("booking_confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showFooter = page === "home" || page === "coming_soon" || page === "my_tickets";

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Đang khởi tạo ứng dụng...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      <Navbar
        onNavigate={navigate}
        currentPage={page}
        userEmail={userEmail}
        userRole={userRole}
        onAuthClick={() => userEmail ? navigate("profile") : navigate("auth")}
        onSearch={handleSearch}
      />

      <main className="flex-1">
        {page === "admin" && (
          <AdminPortalPage
            userRole={userRole}
            onBack={() => navigate("home")}
            concurrencyConfig={concurrencyConfig}
            addSqlLog={addSqlLog}
          />
        )}

        {page === "auth" && (!userEmail || authSubMode === "reset_password") && (
          <AuthPage
            initialMode={authSubMode}
            onSuccess={(email) => {
              // Re-check auth metadata immediately to sync role
              const syncRole = async () => {
                const { data } = await supabase.auth.getSession();
                if (data.session?.user) {
                  const role = data.session.user.user_metadata?.role || "customer";
                  setUserRole(role);
                  setUserEmail(email);
                  
                  // Redirect according to roles
                  if (role === "admin") {
                    navigate("admin");
                  } else {
                    navigate("home");
                  }
                }
              };
              syncRole();
            }}
            onBack={() => navigate("home")}
          />
        )}

        {page === "profile" && userEmail && (
          <UserProfilePage
            userEmail={userEmail}
            onLogout={() => {
              setUserEmail(null);
              setUserRole(null);
              navigate("home");
            }}
            onBack={() => navigate("my_tickets")}
          />
        )}

        {(page === "home" || page === "coming_soon") && (
          <HomePage
            onMovieClick={handleMovieClick}
            showComingSoon={page === "coming_soon"}
            searchQuery={searchQuery}
          />
        )}
        
        {page === "my_tickets" && (
          <MyTicketsPage 
            userEmail={userEmail} 
            onHome={() => navigate("home")} 
            onAuth={() => navigate("auth")} 
          />
        )}

        {page === "movie_detail" && selectedMovie && (
          <MovieDetailPage
            movie={selectedMovie}
            onBack={() => navigate("home")}
            onSelectShowtime={handleSelectShowtime}
            scrollToShowtimes={detailScrollToShowtimes}
          />
        )}

        {page === "seats" && selectedMovie && selectedShowtime && (
          <SeatsPage
            movie={selectedMovie}
            showtime={selectedShowtime}
            userEmail={userEmail}
            onBack={() => {
              setPage("movie_detail");
              window.scrollTo({ top: 0 });
            }}
            onConfirm={handleConfirmSeats}
            concurrencyConfig={concurrencyConfig}
            addSqlLog={addSqlLog}
          />
        )}

        {page === "booking_confirm" && selectedMovie && selectedShowtime && (
          <BookingConfirmPage
            movie={selectedMovie}
            showtime={selectedShowtime}
            selectedSeats={bookedSeats}
            selectedCombos={bookedCombos}
            total={bookingTotal}
            userEmail={userEmail}
            onHome={() => navigate("home")}
            onBack={() => {
              setPage("seats");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            concurrencyConfig={concurrencyConfig}
            addSqlLog={addSqlLog}
          />
        )}
      </main>

      {showFooter && <Footer />}

      <DevPanel
        config={concurrencyConfig}
        onChangeConfig={setConcurrencyConfig}
        logs={sqlLogs}
        onClearLogs={() => setSqlLogs([])}
      />
    </div>
  );
}


function MyTicketsPage({ userEmail, onHome, onAuth }: { userEmail: string | null; onHome: () => void; onAuth: () => void }) {
  const [tickets, setTickets] = useState<BookedTicket[]>([]);

  useEffect(() => {
    const allTickets = loadTickets();
    if (userEmail) {
      setTickets(allTickets.filter(t => t.userEmail === userEmail));
    } else {
      setTickets(allTickets.filter(t => t.userEmail === null)); // Guest tickets
    }
  }, [userEmail]);

  const formatPrice = (n: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "đ";
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <span className="w-1 h-7 bg-red-500 rounded-full" />
          Vé Của Tôi
        </h1>

        {tickets.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto mb-5 text-gray-500">
              <Ticket className="w-9 h-9" />
            </div>
            <p className="text-gray-400 mb-6">
              {userEmail 
                ? "Bạn chưa đặt chiếc vé nào. Hãy chọn phim yêu thích và đặt ngay nhé!" 
                : "Đăng nhập để lưu trữ vé và xem lại lịch sử đặt vé của bạn."}
            </p>
            <button
              onClick={userEmail ? onHome : onAuth}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-3 rounded-xl transition-all"
            >
              {userEmail ? "Khám Phá Phim" : "Đăng Nhập Ngay"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((t) => (
              <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
                
                {/* Header */}
                <div className="bg-zinc-800/50 p-4 flex items-center gap-3 border-b border-zinc-800">
                  <img src={t.moviePoster} alt={t.movieTitle} className="w-12 h-16 object-cover rounded-lg flex-shrink-0 bg-zinc-800" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-white font-bold truncate text-sm sm:text-base">{t.movieTitle}</h3>
                    <p className="text-gray-400 text-xs mt-1">{t.cinemaName}</p>
                    <p className="text-gray-500 text-[10px] mt-0.5">Đặt lúc: {t.bookedAt}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    t.status === "used" ? "bg-zinc-800 text-gray-500 border border-zinc-700" : "bg-green-600/10 text-green-400 border border-green-500/20"
                  }`}>
                    {t.status === "used" ? "Đã dùng" : "Chưa dùng"}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 grid grid-cols-2 gap-3 text-xs border-b border-zinc-800 text-gray-300 font-mono">
                  <div>
                    <span className="text-gray-500 font-sans">Mã đặt vé:</span>
                    <p className="text-white font-bold mt-0.5">{t.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans">Suất chiếu:</span>
                    <p className="text-white font-semibold mt-0.5">{t.showtimeTime} - {t.showtimeDate}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans">Phòng chiếu:</span>
                    <p className="text-white font-semibold mt-0.5">{t.hall}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans">Ghế ngồi:</span>
                    <p className="text-red-400 font-bold mt-0.5">{t.seats.join(", ")}</p>
                  </div>
                </div>

                {/* Footer QR & Price */}
                <div className="p-4 flex items-center justify-between bg-zinc-900/50">
                  <div>
                    <span className="text-gray-500 text-[10px]">Tổng thanh toán:</span>
                    <p className="text-white font-bold text-sm">{formatPrice(t.totalPrice)}</p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${t.id}`} 
                      alt="QR" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
