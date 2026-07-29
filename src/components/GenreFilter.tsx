import { useRef } from "react";
import { ChevronRight } from "lucide-react";

interface GenreFilterProps {
  genres: string[];
  selected: string;
  onSelect: (genre: string) => void;
}

const GenreFilter: React.FC<GenreFilterProps> = ({ genres, selected, onSelect }) => {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative flex items-center gap-2 mb-6">
      <div
        ref={rowRef}
        className="flex gap-2 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {["All", ...genres].map((genre) => (
          <button
            key={genre}
            onClick={() => onSelect(genre)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selected === genre
                ? "bg-[#E50914] text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
      <button
        onClick={() => rowRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
        className="flex-shrink-0 bg-gray-800 hover:bg-gray-700 text-white p-1 rounded-full"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default GenreFilter;
