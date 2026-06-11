import { Star, Clock, ChevronRight } from "lucide-react";
import type { Movie } from "../data/movies";

interface MovieCardProps {
  movie: Movie;
  onViewInfo: (movie: Movie) => void;
  onBookTickets: (movie: Movie) => void;
  size?: "sm" | "md" | "lg";
}

export default function MovieCard({ movie, onViewInfo, onBookTickets, size = "md" }: MovieCardProps) {
  const ratingColor: Record<string, string> = {
    P: "bg-green-600",
    T13: "bg-yellow-600",
    T16: "bg-orange-600",
    C18: "bg-red-700",
  };

  const heights: Record<string, string> = {
    sm: "h-52",
    md: "h-72",
    lg: "h-80",
  };

  return (
    <div
      className="group relative flex flex-col bg-zinc-900 rounded-xl overflow-hidden hover:ring-2 hover:ring-red-500/50 transition-all duration-300 hover:-translate-y-1 text-left"
    >
      {/* Poster */}
      <div 
        onClick={() => onViewInfo(movie)}
        className={`relative ${heights[size]} overflow-hidden flex-shrink-0 cursor-pointer`}
      >
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating Badge */}
        <div className={`absolute top-2 left-2 ${ratingColor[movie.rating] || "bg-gray-700"} text-white text-xs font-bold px-2 py-0.5 rounded z-10`}>
          {movie.rating}
        </div>

        {/* Score */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 z-10">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          {movie.score}
        </div>

        {/* Status for coming soon */}
        {movie.status === "coming_soon" && (
          <div className="absolute bottom-2 left-2 bg-red-650 text-white text-xs font-bold px-2 py-1 rounded z-10">
            Sắp Chiếu
          </div>
        )}

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-lg border border-white/10">
            <span>Xem chi tiết phim</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onViewInfo(movie)}
            className="text-white font-semibold text-sm leading-snug line-clamp-1 hover:text-red-400 transition-colors cursor-pointer"
          >
            {movie.titleVi || movie.title}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{movie.title}</p>

          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3" />
              {movie.duration} phút
            </div>
            <div className="flex flex-wrap gap-1">
              {movie.genre.slice(0, 2).map((g) => (
                <span key={g} className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons at the bottom */}
        <div className="mt-4 flex flex-col gap-2">
          {movie.status === "now_showing" ? (
            <div className="flex gap-2">
              <button
                onClick={() => onViewInfo(movie)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-zinc-700 text-center"
              >
                Chi Tiết
              </button>
              <button
                onClick={() => onBookTickets(movie)}
                className="flex-1 bg-red-650 hover:bg-red-550 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-md shadow-red-600/10 text-center"
              >
                Đặt Vé
              </button>
            </div>
          ) : (
            <button
              onClick={() => onViewInfo(movie)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-zinc-700 text-center"
            >
              Xem Chi Tiết Phim
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
