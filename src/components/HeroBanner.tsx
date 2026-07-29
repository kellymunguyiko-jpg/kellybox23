import { useState, useEffect } from "react";
import { Play, Plus, Star, Clock, Download, Info } from "lucide-react";
import { Movie } from "../types";

interface HeroBannerProps {
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ movies, onWatch, onAddList, onDownload }) => {
  const [current, setCurrent] = useState(0);
  const featured = movies.filter((m) => m.featured || m.backdropUrl);

  useEffect(() => {
    if (featured.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) {
    return (
      <div className="relative w-full h-[65vh] md:h-[90vh] overflow-hidden">
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)"
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-center h-full px-6 md:px-16">
          <div className="text-center max-w-2xl">
            <div className="text-7xl mb-6">🎬</div>
            <h1 className="text-white font-black text-3xl md:text-5xl mb-4">Welcome to KellyBox</h1>
            <p className="text-gray-400 text-lg mb-6">Stream movies and series for free</p>
          </div>
        </div>
      </div>
    );
  }

  const movie = featured[current];
  const hasDownload = (movie.downloadLinks && movie.downloadLinks.length > 0) || !!movie.downloadUrl;

  return (
    <div className="relative w-full h-[65vh] md:h-[90vh] overflow-hidden">
      {/* Background image */}
      {featured.map((m, i) => (
        <div
          key={m.id || i}
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${m.backdropUrl || m.posterUrl})`,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1.5s ease-in-out",
          }}
        />
      ))}

      {/* Gradient overlays - Netflix style */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-12 pb-20 md:pb-32">
        <div className="max-w-xl md:max-w-2xl">
          {/* Type badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="flex items-center gap-2 px-3 py-1 rounded-md font-bold text-sm bg-[#E50914] text-white">
              <span className="text-xs">N</span>
              {movie.type === "series" ? "SERIES" : "MOVIE"}
            </span>
          </div>

          {/* Title - Netflix style */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
            {movie.title}
          </h1>

          {/* Meta info */}
          <div className="flex items-center gap-3 mb-4 text-sm text-gray-300">
            <span className="flex items-center gap-1 text-green-400 font-semibold">
              <Star size={14} fill="currentColor" /> {movie.rating}
            </span>
            <span className="text-gray-400">{movie.year}</span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {movie.duration}
            </span>
            <span className="px-2 py-0.5 rounded border border-gray-600 text-gray-400 text-xs">HD</span>
          </div>

          {/* Description */}
          <p className="text-sm md:text-base text-gray-300 mb-6 line-clamp-3 leading-relaxed max-w-lg">
            {movie.description}
          </p>

          {/* Action Buttons - Netflix style */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Play button */}
            <button
              onClick={() => onWatch(movie)}
              className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black font-bold px-6 md:px-8 py-2.5 md:py-3 rounded-md transition-all hover:scale-105"
            >
              <Play size={20} fill="black" />
              <span className="text-base">Play</span>
            </button>

            {/* Download button */}
            {hasDownload && onDownload && (
              <button
                onClick={() => onDownload(movie)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 md:py-3 rounded-md transition-all hover:scale-105"
              >
                <Download size={18} />
                <span className="text-base hidden sm:inline">Download</span>
              </button>
            )}

            {/* More Info button */}
            <button
              className="flex items-center gap-2 bg-gray-600/60 hover:bg-gray-600/80 text-white font-semibold px-5 py-2.5 md:py-3 rounded-md transition-all hover:scale-105"
            >
              <Info size={18} />
              <span className="text-base hidden sm:inline">More Info</span>
            </button>
          </div>

          {/* My List */}
          <div className="mt-4">
            <button
              onClick={() => onAddList(movie)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <Plus size={18} /> My List
            </button>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      {featured.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all ${
                i === current ? "w-8 bg-white" : "w-4 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
