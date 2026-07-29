import { useState } from "react";
import { Film, Tv, TrendingUp, Search } from "lucide-react";
import { Movie } from "../types";
import MovieCard from "./MovieCard";
import GenreFilter from "./GenreFilter";

interface MoviesPageProps {
  movies: Movie[];
  type: "all" | "movie" | "series";
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  myList: string[];
  searchQuery: string;
  onDownload?: (movie: Movie) => void;
}

const ALL_GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy",
  "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller",
];

const MoviesPage: React.FC<MoviesPageProps> = ({
  movies,
  type,
  onWatch,
  onAddList,
  myList,
  searchQuery,
  onDownload,
}) => {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "rating" | "year" | "az">("latest");

  const filtered = movies
    .filter((m) => {
      if (type === "movie") return m.type === "movie";
      if (type === "series") return m.type === "series";
      return true;
    })
    .filter((m) => selectedGenre === "All" || m.genre.includes(selectedGenre))
    .filter((m) => {
      if (!searchQuery) return true;
      return (
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genre.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    })
    .sort((a, b) => {
      if (sortBy === "latest") return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "year") return b.year - a.year;
      if (sortBy === "az") return a.title.localeCompare(b.title);
      return 0;
    });

  const title =
    type === "movie" ? "Movies" : type === "series" ? "Series" : "All Content";
  const Icon = type === "series" ? Tv : Film;

  return (
    <div className="min-h-screen bg-[#141414] pt-20 pb-12 px-4 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Icon size={24} className="text-[#E50914]" />
          <h1 className="text-white text-2xl md:text-3xl font-bold">{title}</h1>
          <div className="w-1 h-1 rounded-full bg-[#E50914]" />
        </div>
        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs hidden md:block">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-gray-800 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-lg outline-none cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="rating">Top Rated</option>
            <option value="year">Year</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>

      {/* Genre Filter */}
      <GenreFilter
        genres={ALL_GENRES}
        selected={selectedGenre}
        onSelect={setSelectedGenre}
      />

      {/* Search info */}
      {searchQuery && (
        <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm">
          <Search size={14} />
          <span>
            Results for <span className="text-white font-medium">"{searchQuery}"</span>:{" "}
            {filtered.length} found
          </span>
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <TrendingUp size={48} className="mb-4 opacity-30" />
          <p className="text-lg">No content found</p>
          <p className="text-sm mt-1">Try different filters or add content from admin panel</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((movie) => (
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
      )}
    </div>
  );
};

export default MoviesPage;
