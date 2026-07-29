import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import { Movie } from "../types";

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  myList: string[];
  icon?: React.ReactNode;
  onDownload?: (movie: Movie) => void;
}

const MovieRow: React.FC<MovieRowProps> = ({
  title,
  movies,
  onWatch,
  onAddList,
  myList,
  icon,
  onDownload,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const scrollAmount = 300;
    rowRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setTimeout(() => {
      if (!rowRef.current) return;
      setCanScrollLeft(rowRef.current.scrollLeft > 0);
      setCanScrollRight(
        rowRef.current.scrollLeft <
          rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
      );
    }, 300);
  };

  if (movies.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4 px-4 md:px-8">
        {icon && <span className="text-[#E50914]">{icon}</span>}
        <h2 className="text-white text-xl md:text-2xl font-bold">{title}</h2>
        <div className="flex-1 h-px bg-gray-800 ml-2" />
      </div>

      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-r-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Scroll Container */}
        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onScroll={() => {
            if (!rowRef.current) return;
            setCanScrollLeft(rowRef.current.scrollLeft > 0);
            setCanScrollRight(
              rowRef.current.scrollLeft <
                rowRef.current.scrollWidth - rowRef.current.clientWidth - 10
            );
          }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onWatch={onWatch}
              onAddList={onAddList}
              myList={myList}
              onDownload={onDownload}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && movies.length > 4 && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 hover:bg-black/90 text-white p-2 rounded-l-lg transition-all opacity-0 group-hover:opacity-100"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MovieRow;
