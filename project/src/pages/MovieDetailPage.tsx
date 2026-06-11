import { useState } from "react";
import { ArrowLeft, Star, Clock, Calendar, ChevronRight, Play, Users, Globe, Ticket } from "lucide-react";
import type { Movie, Showtime } from "../data/movies";
import { cinemas, TICKET_PRICES } from "../data/movies";
import { loadShowtimes } from "../lib/db";
import { useEffect } from "react";

interface MovieDetailPageProps {
  movie: Movie;
  onBack: () => void;
  onSelectShowtime: (showtime: Showtime, movie: Movie) => void;
  scrollToShowtimes?: boolean;
}

const SHOW_DATES = ["01/06", "02/06", "03/06", "04/06", "05/06", "06/06", "07/06"];
const DATE_VALUES = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07"];
const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  "4dx": "4DX",
  imax: "IMAX",
  sweetbox: "Sweetbox",
};

const TYPE_COLORS: Record<string, string> = {
  standard: "bg-slate-700/50 text-slate-200 border-slate-600",
  "4dx": "bg-orange-900/40 text-orange-300 border-orange-700",
  imax: "bg-blue-900/40 text-blue-300 border-blue-700",
  sweetbox: "bg-rose-900/40 text-rose-300 border-rose-700",
};

export default function MovieDetailPage({ movie, onBack, onSelectShowtime, scrollToShowtimes = false }: MovieDetailPageProps) {
  const [showShowtimes, setShowShowtimes] = useState(scrollToShowtimes);
  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedCinema, setSelectedCinema] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("Tất cả");
  const [showtimesList, setShowtimesList] = useState<Showtime[]>([]);

  useEffect(() => {
    setShowShowtimes(scrollToShowtimes);
    if (scrollToShowtimes && movie.status === "now_showing") {
      const timer = setTimeout(() => {
        const el = document.getElementById("showtimes-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scrollToShowtimes, movie.id, movie.status]);

  useEffect(() => {
    setShowtimesList(loadShowtimes());
  }, []);

  const movieShowtimes = showtimesList.filter(
    (s) => s.movieId === movie.id && s.date === DATE_VALUES[selectedDate]
  );

  const cinemasWithShows = cinemas.filter((c) =>
    movieShowtimes.some((s) => s.cinemaId === c.id)
  );

  const filteredCinemasByRegion = selectedRegion === "Tất cả"
    ? cinemasWithShows
    : cinemasWithShows.filter(c => c.city === selectedRegion);

  const filteredShowtimes = selectedCinema
    ? movieShowtimes.filter((s) => s.cinemaId === selectedCinema)
    : movieShowtimes;

  const ratingColor: Record<string, string> = {
    P: "bg-green-600", T13: "bg-yellow-600", T16: "bg-orange-600", C18: "bg-red-700",
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN").format(price) + "đ";

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Backdrop */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src={movie.backdrop} alt={movie.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-20 left-4 sm:left-6 flex items-center gap-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg transition-all text-sm z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        {/* Play Trailer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button className="w-14 h-14 bg-white/20 hover:bg-red-650/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all border border-white/20 hover:scale-110 pointer-events-auto shadow-lg shadow-black/20 group">
            <Play className="w-6 h-6 text-white fill-white ml-1 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-36 sm:w-48 rounded-xl shadow-2xl border border-white/10 mx-auto md:mx-0"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 md:pt-8 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-3 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded text-white ${ratingColor[movie.rating] || "bg-gray-700"}`}>
                {movie.rating}
              </span>
              {movie.genre.map((g) => (
                <span key={g} className="text-xs text-gray-300 bg-white/10 px-2.5 py-1 rounded border border-white/10">
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1">
              {movie.titleVi || movie.title}
            </h1>
            <p className="text-gray-400 mb-4">{movie.title}</p>

            <div className="flex items-center gap-6 justify-center md:justify-start mb-5 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold text-lg">{movie.score}</span>
                <span className="text-gray-400 text-sm">/10</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Clock className="w-4 h-4 text-gray-400" />
                {movie.duration} phút
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                {movie.releaseDate}
              </div>
              <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                <Globe className="w-4 h-4 text-gray-400" />
                {movie.language}
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mb-5">
              {movie.description}
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto md:mx-0 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Đạo Diễn</p>
                <p className="text-white font-medium">{movie.director}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Diễn Viên</p>
                <p className="text-white font-medium line-clamp-2">{movie.cast.slice(0, 2).join(", ")}</p>
              </div>
            </div>

            {movie.status === "now_showing" && !showShowtimes && (
              <div className="mt-8 text-center md:text-left">
                <button
                  onClick={() => {
                    setShowShowtimes(true);
                    setTimeout(() => {
                      const el = document.getElementById("showtimes-section");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }, 100);
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/30 flex items-center justify-center gap-2 mx-auto md:mx-0 text-sm active:scale-95"
                >
                  <Ticket className="w-4 h-4" />
                  Xem Lịch Chiếu & Đặt Vé
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Showtimes Section */}
        {movie.status === "now_showing" && showShowtimes && (
          <div id="showtimes-section" className="mb-16 scroll-mt-24">
            <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full" />
              Lịch Chiếu
            </h2>

            {/* Date Picker */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {SHOW_DATES.map((date, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedDate(i); setSelectedCinema(null); }}
                  className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl text-sm font-medium transition-all min-w-[72px] border ${selectedDate === i
                      ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                      : "bg-zinc-900 text-gray-400 border-zinc-800 hover:border-zinc-600 hover:text-white"
                    }`}
                >
                  <span className="text-xs mb-0.5 opacity-70">{DAY_NAMES[(i + 0) % 7]}</span>
                  <span className="font-bold">{date}</span>
                </button>
              ))}
            </div>

            {/* Region Filter */}
            {cinemasWithShows.length > 0 && (
              <div className="mb-4">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Chọn Khu Vực</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {["Tất cả", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"].map((region) => (
                    <button
                      key={region}
                      onClick={() => { setSelectedRegion(region); setSelectedCinema(null); }}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedRegion === region
                          ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                          : "bg-transparent text-gray-400 border-zinc-800 hover:border-zinc-700 hover:text-white"
                        }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cinema Filter */}
            {filteredCinemasByRegion.length > 0 && (
              <div className="mb-6">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-2">Chọn Rạp</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCinema(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedCinema === null
                        ? "bg-white/10 text-white border-white/20"
                        : "bg-transparent text-gray-400 border-zinc-800 hover:border-zinc-650"
                      }`}
                  >
                    Tất cả rạp
                  </button>
                  {filteredCinemasByRegion.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCinema(c.id)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedCinema === c.id
                          ? "bg-white/10 text-white border-white/20"
                          : "bg-transparent text-gray-400 border-zinc-800 hover:border-zinc-650"
                        }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Showtime List */}
            {cinemasWithShows.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl p-12 text-center border border-zinc-800">
                <Calendar className="w-10 h-10 text-gray-650 mx-auto mb-3" />
                <p className="text-gray-400">Chưa có lịch chiếu cho bộ phim này</p>
              </div>
            ) : filteredCinemasByRegion.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl p-12 text-center border border-zinc-800">
                <Calendar className="w-10 h-10 text-gray-650 mx-auto mb-3" />
                <p className="text-gray-400">Hiện chưa có lịch chiếu cho bộ phim này tại khu vực bạn chọn</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(selectedCinema ? filteredCinemasByRegion.filter((c) => c.id === selectedCinema) : filteredCinemasByRegion).map((cinema) => {
                  const cShowtimes = filteredShowtimes.filter((s) => s.cinemaId === cinema.id);
                  if (cShowtimes.length === 0) return null;
                  return (
                      <div key={cinema.id} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-white font-semibold">{cinema.name}</h3>
                            <p className="text-gray-500 text-sm mt-0.5">{cinema.address}, {cinema.city}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-550 flex-shrink-0 mt-1" />
                        </div>

                      <div className="flex flex-wrap gap-3">
                        {cShowtimes.map((st) => {
                          const soldOut = st.availableSeats === 0;
                          const almostFull = st.availableSeats <= 10 && st.availableSeats > 0;
                          return (
                            <button
                              key={st.id}
                              onClick={() => !soldOut && onSelectShowtime(st, movie)}
                              disabled={soldOut}
                              className={`flex flex-col items-start px-4 py-3 rounded-lg border transition-all min-w-[110px] ${soldOut
                                  ? "bg-zinc-800 border-zinc-700 opacity-40 cursor-not-allowed"
                                  : "bg-zinc-800 border-zinc-700 hover:border-red-500/50 hover:bg-zinc-700 cursor-pointer group"
                                }`}
                            >
                              <span className="text-white font-bold text-base group-hover:text-red-400 transition-colors">
                                {st.time}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded border mt-1.5 ${TYPE_COLORS[st.type]}`}>
                                {TYPE_LABELS[st.type]}
                              </span>
                              <div className="flex items-center gap-1 mt-2">
                                <Users className="w-3 h-3 text-gray-500" />
                                <span className={`text-xs ${almostFull ? "text-red-400" : "text-gray-500"}`}>
                                  {soldOut ? "Hết vé" : almostFull ? `Còn ${st.availableSeats} ghế` : `${st.availableSeats} ghế`}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 mt-0.5">
                                {formatPrice(TICKET_PRICES[st.type])}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {movie.status === "coming_soon" && (
          <div className="bg-zinc-900 rounded-xl p-8 text-center border border-zinc-800 mb-16">
            <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h3 className="text-white font-semibold text-lg mb-1">Sắp Ra Mắt</h3>
            <p className="text-gray-400 text-sm">Phim sẽ khởi chiếu vào ngày {movie.releaseDate}</p>
            <button className="mt-4 bg-red-600 hover:bg-red-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
              Nhắc Tôi Khi Có Vé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
