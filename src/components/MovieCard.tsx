import { Play, Plus, Check, Download, Info } from "lucide-react";
import { Movie } from "../types";
import { useState } from "react";

interface MovieCardProps {
  movie: Movie;
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  myList: string[];
  onDownload?: (movie: Movie) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onWatch,
  onAddList,
  myList,
  onDownload,
}) => {
  const [hovered, setHovered] = useState(false);
  const inList = myList.includes(movie.id || "");
  const hasDownload = (movie.downloadLinks?.length || 0) > 0 || !!movie.downloadUrl;

  return (
    <div
      className="group relative flex-shrink-0 w-[160px] md:w-[200px] cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Container - Netflix style */}
      <div className={`relative transition-all duration-300 ${
        hovered ? "z-30 scale-110" : "z-10 scale-100"
      }`}>
        {/* Poster */}
        <div
          className="relative overflow-hidden rounded-md aspect-[2/3] bg-[#181818]"
          onClick={() => onWatch(movie)}
          style={{
            boxShadow: hovered ? "0 8px 30px rgba(0,0,0,0.8)" : "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://placehold.co/300x450/181818/444?text=No+Image";
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Hover content - Netflix style */}
          {hovered && (
            <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
              {/* Action buttons */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onWatch(movie); }}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Play size={14} fill="black" className="text-black ml-0.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddList(movie); }}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                    inList
                      ? "border-white bg-white"
                      : "border-gray-400 hover:border-white"
                  }`}
                >
                  {inList ? <Check size={14} className="text-black" /> : <Plus size={14} className="text-white" />}
                </button>
                {onDownload && hasDownload && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDownload(movie); }}
                    className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-green-400 flex items-center justify-center transition-colors"
                  >
                    <Download size={14} className="text-white" />
                  </button>
                )}
                <button
                  className="w-8 h-8 rounded-full border-2 border-gray-400 hover:border-white flex items-center justify-center transition-colors ml-auto"
                >
                  <Info size={14} className="text-white" />
                </button>
              </div>

              {/* Title */}
              <p className="text-white text-xs font-bold truncate mb-1">{movie.title}</p>

              {/* Meta info */}
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-xs font-bold">{movie.rating}</span>
                <span className="text-gray-400 text-xs">{movie.year}</span>
                <span className="text-gray-500 text-xs border border-gray-600 px-1">HD</span>
              </div>

              {/* Genres */}
              {movie.genre?.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {movie.genre.slice(0, 2).map((g, i) => (
                    <span key={g} className="text-gray-400 text-[10px]">
                      {g}{i < Math.min(movie.genre.length, 2) - 1 ? " • " : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Type badge - always visible */}
          <div className="absolute top-2 left-2 z-10">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
              movie.type === "series"
                ? "bg-blue-600 text-white"
                : "bg-[#E50914] text-white"
            }`}>
              {movie.type === "series" ? "SERIES" : "MOVIE"}
            </span>
          </div>
        </div>

        {/* Title below (visible when not hovered) */}
        {!hovered && (
          <div className="mt-2 px-0.5">
            <p className="text-gray-400 text-xs font-medium truncate">{movie.title}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
