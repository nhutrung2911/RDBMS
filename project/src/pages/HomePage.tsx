import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Clock, Play, Ticket } from "lucide-react";
import { loadMovies } from "../lib/db";
import type { Movie } from "../data/movies";
import MovieCard from "../components/MovieCard";

interface HomePageProps {
  onMovieClick: (movie: Movie, scrollToShowtimes?: boolean) => void;
  showComingSoon?: boolean;
  searchQuery?: string;
}

function HeroSlider({ movies, onMovieClick }: { movies: Movie[]; onMovieClick: (m: Movie, scrollToShowtimes?: boolean) => void }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const heroMovies = movies.filter((m) => m.status === "now_showing").slice(0, 4);

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const timer = setInterval(() => {
      next();
    }, 6000);
    return () => clearInterval(timer);
  }, [current, heroMovies.length]);

  const next = () => {
    if (heroMovies.length === 0 || animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 500);
    setCurrent((c) => (c + 1) % heroMovies.length);
  };

  const prev = () => {
    if (heroMovies.length === 0 || animating) return;
    setAnimating(true);
    setTimeout(() => setAnimating(false), 500);
    setCurrent((c) => (c - 1 + heroMovies.length) % heroMovies.length);
  };

  const movie = heroMovies[current];

  const ratingColor: Record<string, string> = {
    P: "bg-green-600", T13: "bg-yellow-600", T16: "bg-orange-600", C18: "bg-red-700",
  };

  if (heroMovies.length === 0) return null;

  return (
    <div className="relative h-[520px] sm:h-[600px] lg:h-[680px] overflow-hidden bg-black">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${animating ? "opacity-50" : "opacity-100"}`}
      >
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-end pb-16 sm:pb-20">
        <div className="max-w-xl">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs font-bold px-2.5 py-1 rounded ${ratingColor[movie.rating] || "bg-gray-700"} text-white`}>
              {movie.rating}
            </span>
            {movie.genre.slice(0, 2).map((g) => (
              <span key={g} className="text-xs text-gray-300 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded border border-white/10">
                {g}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-1">
            {movie.titleVi || movie.title}
          </h1>
          <p className="text-gray-400 text-base mb-3">{movie.title}</p>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-semibold">{movie.score}</span>
              <span className="text-gray-400 text-sm">/10</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              {movie.duration} phút
            </div>
            <span className="text-gray-400 text-sm">{movie.language}</span>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-6">
            {movie.description}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onMovieClick(movie, true)}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-red-600/30 active:scale-95"
            >
              <Ticket className="w-4 h-4" />
              Đặt Vé Ngay
            </button>
            <button
              onClick={() => onMovieClick(movie, false)}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-medium px-5 py-3 rounded-lg flex items-center gap-2 transition-all border border-white/10"
            >
              <Play className="w-4 h-4" />
              Trailer
            </button>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {heroMovies.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-8 h-2 bg-red-500" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>

      {/* Arrow Controls */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all border border-white/10 hidden sm:flex"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 hover:bg-black/70 text-white rounded-full transition-all border border-white/10 hidden sm:flex"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Thumbnail Strip */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-10">
        {heroMovies.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setCurrent(i)}
            className={`w-20 h-14 rounded-lg overflow-hidden transition-all border-2 ${i === current ? "border-red-500 opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"}`}
          >
            <img src={m.poster} alt={m.title} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}


export default function HomePage({ onMovieClick, showComingSoon = false, searchQuery = "" }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<"now_showing" | "coming_soon">(
    showComingSoon ? "coming_soon" : "now_showing"
  );
  const [moviesList, setMoviesList] = useState<Movie[]>([]);

  useEffect(() => {
    setMoviesList(loadMovies());
  }, []);

  const filteredMovies = moviesList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = m.title.toLowerCase().includes(query);
    const titleViMatch = m.titleVi ? m.titleVi.toLowerCase().includes(query) : false;
    const genreMatch = m.genre.some(g => g.toLowerCase().includes(query));
    return titleMatch || titleViMatch || genreMatch;
  });

  const nowShowing = filteredMovies.filter((m) => m.status === "now_showing");
  const comingSoon = filteredMovies.filter((m) => m.status === "coming_soon");
  const displayMovies = activeTab === "now_showing" ? nowShowing : comingSoon;

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSlider movies={moviesList} onMovieClick={onMovieClick} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-white/5">
          {[
            { key: "now_showing", label: "Phim Đang Chiếu", count: nowShowing.length },
            { key: "coming_soon", label: "Phim Sắp Chiếu", count: comingSoon.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as "now_showing" | "coming_soon")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab.key
                  ? "text-white border-red-500"
                  : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-red-600 text-white" : "bg-white/10 text-gray-400"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Movie Grid */}
        {displayMovies.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
            <p className="text-gray-400 text-sm">Không tìm thấy bộ phim nào phù hợp với từ khóa của bạn.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayMovies.map((movie) => (
              <MovieCard 
                key={movie.id} 
                movie={movie} 
                onViewInfo={(m) => onMovieClick(m, false)}
                onBookTickets={(m) => onMovieClick(m, true)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
