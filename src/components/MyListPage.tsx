
import { Heart, Film } from "lucide-react";
import { Movie } from "../types";
import MovieCard from "./MovieCard";

interface MyListPageProps {
  movies: Movie[];
  myList: string[];
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  onDownload?: (movie: Movie) => void;
}

const MyListPage: React.FC<MyListPageProps> = ({
  movies,
  myList,
  onWatch,
  onAddList,
  onDownload,
}) => {
  const listMovies = movies.filter((m) => myList.includes(m.id || ""));

  return (
    <div className="min-h-screen bg-[#141414] pt-20 pb-12 px-4 md:px-8">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={24} className="text-[#E50914]" fill="#E50914" />
        <h1 className="text-white text-2xl md:text-3xl font-bold">My List</h1>
        <span className="bg-[#E50914] text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
          {listMovies.length}
        </span>
      </div>

      {listMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <Film size={64} className="mb-6 opacity-20" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Your list is empty</h2>
          <p className="text-sm text-center">
            Browse movies and series and click "+ My List" to save them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {listMovies.map((movie) => (
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

export default MyListPage;
