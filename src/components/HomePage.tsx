import { TrendingUp, Film, Tv } from "lucide-react";
import { Movie } from "../types";
import HeroBanner from "./HeroBanner";
import MovieRow from "./MovieRow";

interface HomePageProps {
  movies: Movie[];
  onWatch: (movie: Movie) => void;
  onAddList: (movie: Movie) => void;
  myList: string[];
  onDownload?: (movie: Movie) => void;
}

const HomePage: React.FC<HomePageProps> = ({
  movies,
  onWatch,
  onAddList,
  myList,
  onDownload,
}) => {
  const trending = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 12);
  const movieList = movies.filter((m) => m.type === "movie").slice(0, 12);
  const seriesList = movies.filter((m) => m.type === "series").slice(0, 12);
  const myListMovies = movies.filter((m) => myList.includes(m.id || ""));

  return (
    <div className="bg-[#141414] min-h-screen">
      {/* Hero */}
      <HeroBanner
        movies={movies}
        onWatch={onWatch}
        onAddList={onAddList}
        onDownload={onDownload}
      />

      {/* Content Rows - Netflix style with left padding */}
      <div className="pb-12 -mt-4 relative z-10 pl-0">
        {trending.length > 0 && (
          <MovieRow
            title="Trending Now"
            movies={trending}
            onWatch={onWatch}
            onAddList={onAddList}
            myList={myList}
            icon={<TrendingUp size={20} />}
            onDownload={onDownload}
          />
        )}

        {movieList.length > 0 && (
          <MovieRow
            title="Movies"
            movies={movieList}
            onWatch={onWatch}
            onAddList={onAddList}
            myList={myList}
            icon={<Film size={20} />}
            onDownload={onDownload}
          />
        )}

        {seriesList.length > 0 && (
          <MovieRow
            title="Series"
            movies={seriesList}
            onWatch={onWatch}
            onAddList={onAddList}
            myList={myList}
            icon={<Tv size={20} />}
            onDownload={onDownload}
          />
        )}

        {myListMovies.length > 0 && (
          <MovieRow
            title="My List"
            movies={myListMovies}
            onWatch={onWatch}
            onAddList={onAddList}
            myList={myList}
            onDownload={onDownload}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
