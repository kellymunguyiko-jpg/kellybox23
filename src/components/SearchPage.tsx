import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, X, Star, Film, Clock,
  Zap, Download, Play, Plus, Check,
  ChevronRight, Sparkles, Filter, ArrowUpRight,
  Flame, Grid, List, ChevronDown
} from "lucide-react";
import { Movie } from "../types";

interface SearchPageProps {
  movies: Movie[];
  initialQuery: string;
  onSearch: (q: string) => void;
  onWatch: (movie: Movie) => void;
  onDownload: (movie: Movie) => void;
  myList: string[];
  onAddList: (movie: Movie) => void;
}

const GENRES = [
  "Action","Adventure","Animation","Biography","Comedy",
  "Crime","Documentary","Drama","Fantasy","Horror","Romance","Sci-Fi","Thriller",
];

const GENRE_META: Record<string, { color: string; emoji: string; glow: string }> = {
  Action:      { color: "from-red-600/30 to-red-900/10",      emoji: "💥", glow: "rgba(239,68,68,0.4)" },
  Adventure:   { color: "from-orange-600/30 to-orange-900/10",emoji: "🗺️", glow: "rgba(249,115,22,0.4)" },
  Animation:   { color: "from-yellow-600/30 to-yellow-900/10",emoji: "✨", glow: "rgba(234,179,8,0.4)" },
  Biography:   { color: "from-amber-600/30 to-amber-900/10",  emoji: "📖", glow: "rgba(245,158,11,0.4)" },
  Comedy:      { color: "from-lime-600/30 to-lime-900/10",    emoji: "😂", glow: "rgba(132,204,22,0.4)" },
  Crime:       { color: "from-gray-600/30 to-gray-900/10",    emoji: "🔫", glow: "rgba(107,114,128,0.4)" },
  Documentary: { color: "from-teal-600/30 to-teal-900/10",   emoji: "🎥", glow: "rgba(20,184,166,0.4)" },
  Drama:       { color: "from-purple-600/30 to-purple-900/10",emoji: "🎭", glow: "rgba(168,85,247,0.4)" },
  Fantasy:     { color: "from-indigo-600/30 to-indigo-900/10",emoji: "🧙", glow: "rgba(99,102,241,0.4)" },
  Horror:      { color: "from-zinc-700/30 to-black/50",       emoji: "👻", glow: "rgba(63,63,70,0.4)" },
  Romance:     { color: "from-pink-600/30 to-pink-900/10",    emoji: "❤️", glow: "rgba(236,72,153,0.4)" },
  "Sci-Fi":    { color: "from-cyan-600/30 to-cyan-900/10",    emoji: "🚀", glow: "rgba(6,182,212,0.4)" },
  Thriller:    { color: "from-slate-600/30 to-slate-900/10",  emoji: "🔪", glow: "rgba(100,116,139,0.4)" },
};

function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

const SearchPage: React.FC<SearchPageProps> = ({
  movies, initialQuery, onSearch, onWatch, onDownload, myList, onAddList,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery); // only updates on Enter/Search click
  const [focused, setFocused] = useState(false);
  const [activeGenre, setActiveGenre] = useState("All");
  const [activeType, setActiveType] = useState<"all" | "movie" | "series">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "rating" | "year" | "title">("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [searchShake, setSearchShake] = useState(false); // shake animation on empty search
  const [searchSubmitted, setSearchSubmitted] = useState(!!initialQuery); // tracks if user has searched
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("kb_recent") || "[]"); } catch { return []; }
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(submittedQuery, 180);

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      setTimeout(() => setAnimStep(1), 100);
      setTimeout(() => setAnimStep(2), 250);
      setTimeout(() => setAnimStep(3), 400);
    });
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  useEffect(() => { setQuery(initialQuery); }, [initialQuery]);

  const saveSearch = useCallback((q: string) => {
    if (!q.trim()) return;
    const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("kb_recent", JSON.stringify(updated));
  }, [recentSearches]);

  const clearRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("kb_recent", JSON.stringify(updated));
  };

  const handleQueryChange = (val: string) => {
    setQuery(val); // only update input — do NOT search yet
    setShowSuggestions(true);
    if (!val.trim()) {
      // if cleared, reset results too
      setSubmittedQuery("");
      setSearchSubmitted(false);
      onSearch("");
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    saveSearch(movie.title);
    setShowSuggestions(false);
    onWatch(movie);
  };

  const handleSubmit = () => {
    if (!query.trim()) {
      // shake animation if empty
      setSearchShake(true);
      setTimeout(() => setSearchShake(false), 600);
      inputRef.current?.focus();
      return;
    }
    saveSearch(query.trim());
    setSubmittedQuery(query.trim()); // NOW trigger the search
    setSearchSubmitted(true);
    setShowSuggestions(false);
    onSearch(query.trim());
    inputRef.current?.blur();
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setSubmittedQuery(term);
    setSearchSubmitted(true);
    onSearch(term);
    setShowSuggestions(false);
  };

  // Suggestions use live query (for dropdown preview)
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return movies.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.genre || []).some(g => g.toLowerCase().includes(q))
    ).slice(0, 7);
  }, [movies, query]);

  // Results only filter on submittedQuery (after Enter/Search click)
  const filtered = useMemo(() => movies.filter(m => {
    const q = debouncedQuery.toLowerCase();
    const matchQ = !q ||
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      (m.genre || []).some(g => g.toLowerCase().includes(q));
    const matchG = activeGenre === "All" || (m.genre || []).includes(activeGenre);
    const matchT = activeType === "all" || m.type === activeType;
    return matchQ && matchG && matchT;
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "year")   return (b.year   || 0) - (a.year   || 0);
    if (sortBy === "title")  return a.title.localeCompare(b.title);
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      return (b.title.toLowerCase().startsWith(q) ? 1 : 0) - (a.title.toLowerCase().startsWith(q) ? 1 : 0);
    }
    return 0;
  }), [movies, debouncedQuery, activeGenre, activeType, sortBy]);

  const trending = useMemo(() => [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10), [movies]);
  // hasActiveFilter gates result section — only true if user actually submitted a search or picked a genre/type
  const hasActiveFilter = searchSubmitted || activeGenre !== "All" || activeType !== "all";

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return <>{text}</>;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return (
      <>
        {text.split(re).map((p, i) =>
          re.test(p)
            ? <mark key={i} className="bg-[#E50914]/50 text-white rounded px-0.5 not-italic font-black">{p}</mark>
            : <span key={i}>{p}</span>
        )}
      </>
    );
  };

  const handleDirectDownload = (e: React.MouseEvent, movie: Movie) => {
    e.stopPropagation();
    if (movie.downloadLinks && movie.downloadLinks.length === 1) {
      window.open(movie.downloadLinks[0].url, "_blank");
    } else if (movie.downloadLinks && movie.downloadLinks.length > 1) {
      onDownload(movie);
    } else if (movie.downloadUrl) {
      window.open(movie.downloadUrl, "_blank");
    }
  };

  const hasDownload = (movie: Movie) => (movie.downloadLinks?.length || 0) > 0 || !!movie.downloadUrl;

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>

      {/* ══ HERO SEARCH SECTION ══════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ paddingTop: "80px", paddingBottom: "40px" }}>

        {/* Animated background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{
              background: focused
                ? "radial-gradient(ellipse, rgba(229,9,20,0.15) 0%, transparent 65%)"
                : "radial-gradient(ellipse, rgba(229,9,20,0.05) 0%, transparent 65%)",
              transition: "background 1s ease",
              filter: "blur(40px)",
            }}
          />
          <div
            className="absolute -top-20 -left-20 w-80 h-80 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(229,9,20,0.06) 0%, transparent 70%)",
              animation: "blobFloat 8s ease-in-out infinite",
            }}
          />
          <div
            className="absolute -top-10 -right-20 w-64 h-64 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(229,9,20,0.04) 0%, transparent 70%)",
              animation: "blobFloat 10s ease-in-out infinite reverse",
            }}
          />
          {/* Floating particles */}
          {[...Array(18)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${(i / 18) * 100}%`,
                top: `${10 + (i % 5) * 18}%`,
                background: i % 3 === 0 ? "rgba(229,9,20,0.5)" : i % 3 === 1 ? "rgba(255,255,255,0.15)" : "rgba(229,9,20,0.25)",
                animation: `particleFloat ${4 + (i % 4)}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-2xl mx-auto px-4">

          {/* Badge */}
          <div
            className="flex justify-center mb-5"
            style={{
              opacity: animStep >= 1 ? 1 : 0,
              transform: animStep >= 1 ? "none" : "translateY(-12px)",
              transition: "all 0.5s ease",
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(229,9,20,0.1)",
                border: "1px solid rgba(229,9,20,0.25)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Sparkles size={12} className="text-[#E50914]" style={{ animation: "pulse 2s ease infinite" }} />
              <span className="text-[#E50914] text-[11px] font-black tracking-widest uppercase">KellyBox Search</span>
              <Sparkles size={12} className="text-[#E50914]" style={{ animation: "pulse 2s ease infinite 0.5s" }} />
            </div>
          </div>

          {/* Title */}
          <div
            className="text-center mb-7"
            style={{
              opacity: animStep >= 1 ? 1 : 0,
              transform: animStep >= 1 ? "none" : "translateY(16px)",
              transition: "all 0.6s ease 0.1s",
            }}
          >
            <h1 className="text-white font-black mb-2" style={{ fontSize: "clamp(1.6rem, 4vw, 2.4rem)", lineHeight: 1.1 }}>
              Find Your Next{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #E50914, #ff6b6b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Favorite
              </span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              {movies.length} titles · Movies · Series · All genres
            </p>
          </div>

          {/* ── MAIN SEARCH BAR ── */}
          <div
            className="relative"
            style={{
              opacity: animStep >= 2 ? 1 : 0,
              transform: animStep >= 2 ? "none" : "translateY(20px) scale(0.98)",
              transition: "all 0.6s ease 0.2s",
            }}
          >
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-3xl transition-all duration-500 pointer-events-none"
              style={{
                background: focused
                  ? "linear-gradient(135deg, rgba(229,9,20,0.3), rgba(229,9,20,0.1), rgba(229,9,20,0.3))"
                  : "transparent",
                filter: "blur(8px)",
              }}
            />

            <div
              className="relative flex items-center rounded-2xl transition-all duration-400"
              style={{
                background: focused ? "#1a1a1a" : "#141414",
                border: searchShake ? "2px solid #ff4444" : focused ? "2px solid #E50914" : "2px solid #222",
                boxShadow: searchShake
                  ? "0 0 0 4px rgba(255,68,68,0.15), 0 24px 60px rgba(0,0,0,0.6)"
                  : focused
                  ? "0 0 0 4px rgba(229,9,20,0.06), 0 24px 60px rgba(0,0,0,0.6)"
                  : "0 8px 32px rgba(0,0,0,0.4)",
                padding: "14px 16px",
                animation: searchShake ? "shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)" : "none",
              }}
            >
              {/* Search icon */}
              <div
                className="flex-shrink-0 mr-3 transition-all duration-300"
                style={{ color: focused ? "#E50914" : "#444" }}
              >
                <Search
                  size={22}
                  style={{
                    transform: focused ? "rotate(-10deg) scale(1.1)" : "none",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                onFocus={() => { setFocused(true); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => { setFocused(false); setShowSuggestions(false); }, 200)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleSubmit();
                  if (e.key === "Escape") {
                    setQuery("");
                    setSubmittedQuery("");
                    setSearchSubmitted(false);
                    onSearch("");
                    setShowSuggestions(false);
                  }
                }}
                placeholder="Search movies, series, genres..."
                className="flex-1 bg-transparent text-white outline-none min-w-0 font-medium placeholder-gray-700"
                style={{ fontSize: "15px" }}
              />

              {/* Clear button */}
              {query && (
                <button
                  onClick={() => { setQuery(""); setSubmittedQuery(""); setSearchSubmitted(false); onSearch(""); inputRef.current?.focus(); }}
                  className="flex-shrink-0 ml-2 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}

              {/* Search button */}
              {query && (
                <button
                  onClick={handleSubmit}
                  className="flex-shrink-0 ml-2 flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition-all active:scale-95 hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #E50914, #c50812)",
                    color: "white",
                    fontSize: "13px",
                    boxShadow: "0 4px 16px rgba(229,9,20,0.4)",
                    animation: query.trim() && !searchSubmitted ? "enterPulse 1.8s ease-in-out infinite" : "none",
                  }}
                >
                  Search <ArrowUpRight size={13} />
                </button>
              )}
            </div>

            {/* ── PRESS ENTER HINT ── */}
            <div
              className="flex items-center justify-between mt-3 px-1 transition-all duration-300"
              style={{ opacity: focused ? 1 : 0, transform: focused ? "none" : "translateY(-4px)" }}
            >
              <div className="flex items-center gap-3">
                {/* Keyboard hint */}
                <div className="flex items-center gap-1.5">
                  <kbd
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] transition-all"
                    style={{
                      background: query.trim() ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.06)",
                      border: query.trim() ? "1px solid rgba(229,9,20,0.4)" : "1px solid rgba(255,255,255,0.1)",
                      color: query.trim() ? "#f87171" : "#555",
                      boxShadow: query.trim() ? "0 2px 8px rgba(229,9,20,0.2)" : "none",
                    }}
                  >
                    ↵ Enter
                  </kbd>
                  <span className="text-xs font-medium" style={{ color: query.trim() ? "#888" : "#444" }}>
                    {query.trim() ? "to search" : "after typing"}
                  </span>
                </div>
                {query.trim() && !searchSubmitted && (
                  <div className="flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#E50914" }} />
                    <span className="text-[11px] font-semibold" style={{ color: "#E50914" }}>
                      Press Enter to find "{query}"
                    </span>
                  </div>
                )}
                {searchSubmitted && debouncedQuery && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#22c55e" }} />
                    <span className="text-[11px] font-semibold text-green-400">
                      {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[11px]" style={{ color: "#333" }}>
                <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#444" }}>Esc</kbd>
                {" "}to clear
              </span>
            </div>

            {/* ── SUGGESTIONS DROPDOWN ── */}
            {showSuggestions && (focused || query) && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                style={{
                  background: "#141414",
                  border: "1px solid #252525",
                  boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,9,20,0.05)",
                  animation: "dropdownIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {/* Recent searches */}
                {!query && recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1e1e1e" }}>
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-600" />
                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">Recent</span>
                      </div>
                      <button
                        onClick={() => { setRecentSearches([]); localStorage.removeItem("kb_recent"); }}
                        className="text-gray-700 hover:text-red-400 text-[10px] font-semibold transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    {recentSearches.map((term, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer group transition-all"
                        style={{ borderBottom: i < recentSearches.length - 1 ? "1px solid #181818" : "none" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => handleRecentClick(term)}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <Clock size={12} className="text-gray-600" />
                        </div>
                        <span className="text-gray-300 text-sm flex-1 font-medium">{term}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => clearRecent(term, e)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors"
                          >
                            <X size={11} className="text-gray-600 hover:text-red-400" />
                          </button>
                          <ChevronRight size={13} className="text-gray-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Live movie suggestions */}
                {query && suggestions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid #1e1e1e" }}>
                      <div className="flex items-center gap-2">
                        <Zap size={11} className="text-[#E50914]" />
                        <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
                          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {suggestions.map((movie, i) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer group transition-all"
                        style={{
                          borderBottom: i < suggestions.length - 1 ? "1px solid #181818" : "none",
                          animation: `suggestionIn 0.2s ease ${i * 40}ms both`,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,9,20,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        onClick={() => handleSelectMovie(movie)}
                      >
                        {/* Poster thumbnail */}
                        <div
                          className="w-9 h-13 rounded-lg overflow-hidden flex-shrink-0"
                          style={{ aspectRatio: "2/3", width: "36px", height: "54px", background: "#1e1e1e" }}
                        >
                          {movie.posterUrl
                            ? <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Film size={14} className="text-gray-700" /></div>
                          }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">
                            {highlight(movie.title, query)}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-gray-600 text-[10px]">{movie.year}</span>
                            <span className="text-gray-700 text-[10px]">·</span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-black"
                              style={{
                                background: movie.type === "series" ? "rgba(59,130,246,0.2)" : "rgba(229,9,20,0.2)",
                                color: movie.type === "series" ? "#60a5fa" : "#f87171",
                              }}
                            >
                              {movie.type === "series" ? "SERIES" : "MOVIE"}
                            </span>
                            {movie.rating && (
                              <>
                                <span className="text-gray-700 text-[10px]">·</span>
                                <span className="flex items-center gap-0.5 text-yellow-400 text-[10px] font-bold">
                                  <Star size={8} fill="currentColor" />{movie.rating}
                                </span>
                              </>
                            )}
                            {movie.genre?.[0] && (
                              <>
                                <span className="text-gray-700 text-[10px]">·</span>
                                <span className="text-gray-600 text-[10px]">{movie.genre[0]}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: "rgba(229,9,20,0.15)" }}
                        >
                          <Play size={11} fill="#E50914" className="text-[#E50914] ml-0.5" />
                        </div>
                      </div>
                    ))}

                    {/* See all */}
                    {filtered.length > 7 && (
                      <div
                        className="px-4 py-3 text-center cursor-pointer transition-all"
                        style={{ borderTop: "1px solid #1e1e1e", background: "rgba(229,9,20,0.03)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(229,9,20,0.07)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(229,9,20,0.03)")}
                        onClick={handleSubmit}
                      >
                        <span className="text-[#E50914] text-xs font-black flex items-center justify-center gap-1">
                          View all {filtered.length} results <ArrowUpRight size={12} />
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* No results */}
                {query && suggestions.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <Search size={20} className="text-gray-700" />
                    </div>
                    <p className="text-gray-500 text-sm mb-1">No results for</p>
                    <p className="text-white font-bold">"{query}"</p>
                  </div>
                )}

                {/* Empty state (no query, no recent) */}
                {!query && recentSearches.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <Search size={24} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">Start typing to search...</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Quick Genre Pills ── */}
          {!query && (
            <div
              className="flex flex-wrap gap-2 mt-5 justify-center"
              style={{
                opacity: animStep >= 3 ? 1 : 0,
                transform: animStep >= 3 ? "none" : "translateY(10px)",
                transition: "all 0.5s ease 0.4s",
              }}
            >
              {GENRES.slice(0, 9).map((g, i) => {
                const meta = GENRE_META[g];
                const isActive = activeGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => { setActiveGenre(isActive ? "All" : g); if (!isActive) setSearchSubmitted(true); }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isActive ? "#E50914" : "rgba(255,255,255,0.05)",
                      border: isActive ? "1px solid #E50914" : "1px solid rgba(255,255,255,0.08)",
                      color: isActive ? "white" : "#777",
                      boxShadow: isActive ? "0 4px 16px rgba(229,9,20,0.35)" : "none",
                      animationDelay: `${i * 40}ms`,
                    }}
                  >
                    {meta?.emoji} {g}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ FILTER BAR ══════════════════════════════════════════════════════════ */}
      <div
        className="sticky z-30"
        style={{
          top: "64px",
          background: "rgba(8,8,8,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">

            {/* Type filter */}
            <div
              className="flex items-center rounded-xl overflow-hidden flex-shrink-0"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
            >
              {(["all", "movie", "series"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setActiveType(t); if (t !== "all") setSearchSubmitted(true); }}
                  className="px-3 py-1.5 text-[11px] font-black capitalize transition-all"
                  style={{
                    background: activeType === t ? "#E50914" : "transparent",
                    color: activeType === t ? "white" : "#555",
                    boxShadow: activeType === t ? "0 2px 8px rgba(229,9,20,0.4)" : "none",
                  }}
                >
                  {t === "all" ? "All" : t === "movie" ? "🎬 Movies" : "📺 Series"}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-5 flex-shrink-0" style={{ background: "#1e1e1e" }} />

            {/* Genre pills */}
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto hide-scrollbar">
              {["All", ...GENRES].map(g => {
                const isActive = activeGenre === g;
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGenre(g)}
                    className="flex-shrink-0 px-3 py-1.5 text-[11px] font-bold rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: isActive ? "rgba(229,9,20,0.9)" : "rgba(255,255,255,0.04)",
                      color: isActive ? "white" : "#555",
                      border: isActive ? "1px solid #E50914" : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isActive ? "0 0 12px rgba(229,9,20,0.35)" : "none",
                    }}
                  >
                    {g !== "All" && GENRE_META[g]?.emoji} {g}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="w-px h-5 flex-shrink-0" style={{ background: "#1e1e1e" }} />

            {/* Sort dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all flex-shrink-0"
                style={{
                  background: showSortMenu ? "rgba(229,9,20,0.15)" : "rgba(255,255,255,0.04)",
                  border: showSortMenu ? "1px solid rgba(229,9,20,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  color: showSortMenu ? "#E50914" : "#555",
                }}
              >
                <Filter size={11} />
                {sortBy === "relevance" ? "Sort" : sortBy === "rating" ? "⭐ Rating" : sortBy === "year" ? "📅 New" : "🔤 A-Z"}
                <ChevronDown size={11} style={{ transform: showSortMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showSortMenu && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 w-44"
                  style={{
                    background: "#141414",
                    border: "1px solid #252525",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                    animation: "dropdownIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                >
                  {[
                    { v: "relevance", l: "⚡ Relevance", sub: "Best match first" },
                    { v: "rating",    l: "⭐ Top Rated",  sub: "Highest score first" },
                    { v: "year",      l: "📅 Newest",     sub: "Latest releases first" },
                    { v: "title",     l: "🔤 A–Z",        sub: "Alphabetical order" },
                  ].map(o => (
                    <button
                      key={o.v}
                      onClick={() => { setSortBy(o.v as typeof sortBy); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-3 transition-all"
                      style={{
                        background: sortBy === o.v ? "rgba(229,9,20,0.1)" : "transparent",
                        borderLeft: sortBy === o.v ? "3px solid #E50914" : "3px solid transparent",
                      }}
                      onMouseEnter={e => { if (sortBy !== o.v) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                      onMouseLeave={e => { if (sortBy !== o.v) e.currentTarget.style.background = "transparent"; }}
                    >
                      <p className="text-xs font-bold" style={{ color: sortBy === o.v ? "#E50914" : "#aaa" }}>{o.l}</p>
                      <p className="text-[10px] text-gray-700 mt-0.5">{o.sub}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View mode */}
            <div className="flex items-center rounded-xl overflow-hidden flex-shrink-0" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="p-1.5 transition-all"
                style={{ background: viewMode === "grid" ? "#E50914" : "transparent", color: viewMode === "grid" ? "white" : "#555" }}
              >
                <Grid size={13} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="p-1.5 transition-all"
                style={{ background: viewMode === "list" ? "#E50914" : "transparent", color: viewMode === "list" ? "white" : "#555" }}
              >
                <List size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── NO FILTER: Trending + Genre Grid ── */}
        {!hasActiveFilter && (
          <div>
            {/* Trending Now */}
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Flame size={18} className="text-[#E50914]" />
                  <h2 className="text-white font-black text-xl">Trending Now</h2>
                </div>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(229,9,20,0.3), transparent)" }} />
                <span className="text-gray-700 text-xs font-semibold">{trending.length} titles</span>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
                {trending.map((movie, i) => (
                  <button
                    key={movie.id}
                    onClick={() => onWatch(movie)}
                    className="group relative rounded-xl overflow-hidden bg-gray-900 text-left"
                    style={{
                      aspectRatio: "2/3",
                      opacity: mounted ? 1 : 0,
                      transform: mounted ? "none" : "translateY(20px) scale(0.95)",
                      transition: `all 0.4s ease ${i * 45}ms`,
                    }}
                  >
                    {movie.posterUrl
                      ? <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      : <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a1a" }}><Film size={20} className="text-gray-700" /></div>
                    }

                    {/* Rank badge */}
                    <div
                      className="absolute top-2 left-2 w-6 h-6 rounded-lg flex items-center justify-center font-black shadow-lg"
                      style={{
                        background: i < 3 ? "linear-gradient(135deg, #E50914, #c50812)" : "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(4px)",
                        fontSize: "10px",
                        color: "white",
                        boxShadow: i < 3 ? "0 2px 12px rgba(229,9,20,0.5)" : "none",
                        border: i >= 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
                      }}
                    >
                      #{i + 1}
                    </div>

                    {/* Hover overlay */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)" }}
                    >
                      <p className="text-white text-[10px] font-bold leading-tight line-clamp-2">{movie.title}</p>
                      {movie.rating && (
                        <div className="flex items-center gap-0.5 mt-1">
                          <Star size={8} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-yellow-400 text-[9px] font-bold">{movie.rating}</span>
                        </div>
                      )}
                    </div>

                    {/* Play button */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(229,9,20,0.9)", boxShadow: "0 0 24px rgba(229,9,20,0.6)" }}
                      >
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Browse by Genre */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400" />
                  <h2 className="text-white font-black text-xl">Browse by Genre</h2>
                </div>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(255,200,0,0.3), transparent)" }} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
                {GENRES.map((genre, i) => {
                  const meta = GENRE_META[genre];
                  const count = movies.filter(m => (m.genre || []).includes(genre)).length;
                  const isHovered = hoveredGenre === genre;
                  return (
                    <button
                      key={genre}
                      onClick={() => setActiveGenre(genre)}
                      onMouseEnter={() => setHoveredGenre(genre)}
                      onMouseLeave={() => setHoveredGenre(null)}
                      className="relative rounded-2xl p-4 text-left overflow-hidden transition-all duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${isHovered ? meta?.glow?.replace("0.4", "0.2") : "rgba(255,255,255,0.03)"}, rgba(0,0,0,0.3))`,
                        border: isHovered ? `1px solid ${meta?.glow?.replace("0.4", "0.5")}` : "1px solid rgba(255,255,255,0.06)",
                        boxShadow: isHovered ? `0 8px 32px ${meta?.glow?.replace("0.4", "0.25")}` : "none",
                        transform: isHovered ? "translateY(-3px) scale(1.02)" : "none",
                        opacity: mounted ? 1 : 0,
                        transition: `all 0.3s ease ${i * 35}ms`,
                      }}
                    >
                      {/* Background glow blob */}
                      <div
                        className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                        style={{
                          background: isHovered ? `radial-gradient(circle, ${meta?.glow}, transparent 70%)` : "transparent",
                          transition: "background 0.3s ease",
                          filter: "blur(16px)",
                        }}
                      />
                      <div className="text-3xl mb-2">{meta?.emoji}</div>
                      <p className="text-white font-black text-sm leading-tight">{genre}</p>
                      <p className="text-gray-600 text-[10px] mt-1 font-semibold">{count} title{count !== 1 ? "s" : ""}</p>
                      {/* Active indicator */}
                      {activeGenre === genre && (
                        <div
                          className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full"
                          style={{ background: "#E50914", boxShadow: "0 0 6px rgba(229,9,20,0.8)" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── SEARCH RESULTS ── */}
        {hasActiveFilter && (
          <div>
            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                {debouncedQuery.trim() ? (
                  <>
                    <h2 className="text-white font-black text-xl">
                      Results for{" "}
                      <span style={{ color: "#E50914" }}>"{debouncedQuery}"</span>
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      <span className="text-white font-bold">{filtered.length}</span> title{filtered.length !== 1 ? "s" : ""} found
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-white font-black text-xl flex items-center gap-2">
                      {activeGenre !== "All" && <span>{GENRE_META[activeGenre]?.emoji}</span>}
                      {activeGenre !== "All" ? activeGenre : "All"}{" "}
                      {activeType !== "all" ? (activeType === "movie" ? "Movies" : "Series") : "Titles"}
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                      <span className="text-white font-bold">{filtered.length}</span> titles
                    </p>
                  </>
                )}
              </div>

              {/* Active filters + clear */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {debouncedQuery && (
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:brightness-110"
                    style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)", color: "#f87171" }}
                    onClick={() => { setQuery(""); setSubmittedQuery(""); setSearchSubmitted(false); onSearch(""); }}
                  >
                    "{debouncedQuery}" <X size={10} />
                  </span>
                )}
                {activeGenre !== "All" && (
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:brightness-110"
                    style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)", color: "#f87171" }}
                    onClick={() => setActiveGenre("All")}
                  >
                    {GENRE_META[activeGenre]?.emoji} {activeGenre} <X size={10} />
                  </span>
                )}
                {activeType !== "all" && (
                  <span
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all hover:brightness-110"
                    style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)", color: "#f87171" }}
                    onClick={() => setActiveType("all")}
                  >
                    {activeType === "movie" ? "🎬 Movies" : "📺 Series"} <X size={10} />
                  </span>
                )}
                <button
                  onClick={() => { setQuery(""); setSubmittedQuery(""); setSearchSubmitted(false); onSearch(""); setActiveGenre("All"); setActiveType("all"); setSortBy("relevance"); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", color: "#666", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <X size={10} /> Clear all
                </button>
              </div>
            </div>

            {/* Results empty */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
                  style={{ background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.06)" }}
                >
                  <Search size={36} className="text-gray-700" />
                  <div
                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)" }}
                  >
                    <X size={14} className="text-[#E50914]" />
                  </div>
                </div>
                <h3 className="text-white font-black text-2xl mb-2">Nothing found</h3>
                <p className="text-gray-500 text-sm mb-1">We couldn't find anything matching</p>
                <p className="text-gray-300 font-bold mb-6">"{debouncedQuery || activeGenre}"</p>
                <div className="flex items-center gap-2 text-gray-600 text-xs mb-6 flex-wrap justify-center">
                  <span>Try:</span>
                  {["Different spelling", "Shorter keyword", "Genre name", "Actor name"].map(t => (
                    <span key={t} className="px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>{t}</span>
                  ))}
                </div>
                <button
                  onClick={() => { setQuery(""); setSubmittedQuery(""); setSearchSubmitted(false); onSearch(""); setActiveGenre("All"); setActiveType("all"); }}
                  className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl transition-all active:scale-95 hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #E50914, #c50812)", color: "white", boxShadow: "0 4px 20px rgba(229,9,20,0.4)" }}
                >
                  <X size={14} /> Clear Search
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid view */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered.map((movie, i) => (
                  <SearchResultCard
                    key={movie.id}
                    movie={movie}
                    query={debouncedQuery}
                    index={i}
                    onWatch={onWatch}
                    onDownload={m => handleDirectDownload({ stopPropagation: () => {} } as React.MouseEvent, m)}
                    hasDownload={hasDownload(movie)}
                    inList={myList.includes(movie.id || "")}
                    onAddList={onAddList}
                    highlight={highlight}
                  />
                ))}
              </div>
            ) : (
              /* List view */
              <div className="flex flex-col gap-2">
                {filtered.map((movie, i) => (
                  <SearchResultListItem
                    key={movie.id}
                    movie={movie}
                    query={debouncedQuery}
                    index={i}
                    onWatch={onWatch}
                    onDownload={m => handleDirectDownload({ stopPropagation: () => {} } as React.MouseEvent, m)}
                    hasDownload={hasDownload(movie)}
                    inList={myList.includes(movie.id || "")}
                    onAddList={onAddList}
                    highlight={highlight}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ CSS ANIMATIONS ══════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.97); }
        }
        @keyframes particleFloat {
          from { transform: translateY(0px) scale(1); opacity: 0.4; }
          to   { transform: translateY(-20px) scale(1.2); opacity: 0.9; }
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes suggestionIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes listIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-6px); }
          30%, 70% { transform: translateX(6px); }
        }
        @keyframes enterPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229,9,20,0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(229,9,20,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229,9,20,0); }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .card-in { animation: cardIn 0.35s cubic-bezier(0.34,1.2,0.64,1) forwards; opacity: 0; }
        .list-in { animation: listIn 0.3s ease forwards; opacity: 0; }
      `}</style>
    </div>
  );
};

// ── Grid Result Card ────────────────────────────────────────────────────────────
interface CardProps {
  movie: Movie; query: string; index: number;
  onWatch: (m: Movie) => void; onDownload: (m: Movie) => void;
  hasDownload: boolean; inList: boolean; onAddList: (m: Movie) => void;
  highlight: (text: string, q: string) => React.ReactNode;
}

const SearchResultCard: React.FC<CardProps> = ({
  movie, query, index, onWatch, onDownload, hasDownload, inList, onAddList, highlight
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="card-in group rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: "#111",
        border: hovered ? "1px solid rgba(229,9,20,0.3)" : "1px solid rgba(255,255,255,0.05)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,9,20,0.1)" : "0 4px 16px rgba(0,0,0,0.4)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "none",
        transition: "all 0.3s cubic-bezier(0.34,1.2,0.64,1)",
        animationDelay: `${Math.min(index * 35, 400)}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Poster */}
      <div className="relative overflow-hidden" style={{ aspectRatio: "2/3" }} onClick={() => onWatch(movie)}>
        {movie.posterUrl
          ? <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500" style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }} />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a1a" }}><Film size={28} className="text-gray-700" /></div>
        }

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-md font-black"
            style={{
              background: movie.type === "series" ? "rgba(59,130,246,0.85)" : "rgba(229,9,20,0.85)",
              color: "white",
              backdropFilter: "blur(4px)",
            }}
          >
            {movie.type === "series" ? "SERIES" : "MOVIE"}
          </span>
        </div>

        {/* Rating badge */}
        {movie.rating && (
          <div
            className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
          >
            <Star size={8} className="text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 text-[9px] font-black">{movie.rating}</span>
          </div>
        )}

        {/* Add to list (top-right when no rating) */}
        <button
          onClick={e => { e.stopPropagation(); onAddList(movie); }}
          className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background: inList ? "rgba(34,197,94,0.85)" : "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "scale(1)" : "scale(0.8)",
            transition: "all 0.25s ease",
            border: inList ? "1px solid rgba(34,197,94,0.5)" : "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {inList ? <Check size={12} className="text-white" /> : <Plus size={12} className="text-white" />}
        </button>

        {/* Play overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
            opacity: hovered ? 1 : 0,
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-1.5"
            style={{
              background: "rgba(229,9,20,0.9)",
              boxShadow: "0 0 28px rgba(229,9,20,0.6)",
              transform: hovered ? "scale(1)" : "scale(0.7)",
              transition: "transform 0.3s ease",
            }}
          >
            <Play size={18} fill="white" className="text-white ml-1" />
          </div>
          <span className="text-white text-[10px] font-black">Play Now</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-white text-[11px] font-bold leading-tight line-clamp-1 mb-1">
          {highlight(movie.title, query)}
        </p>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-gray-600 text-[10px]">{movie.year}</span>
          {movie.genre?.[0] && (
            <>
              <span className="text-gray-700 text-[10px]">·</span>
              <span className="text-gray-600 text-[10px] truncate">{movie.genre[0]}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5">
          <button
            onClick={() => onWatch(movie)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 hover:brightness-110"
            style={{ background: "white", color: "black" }}
          >
            <Play size={9} fill="black" /> Play
          </button>
          {hasDownload && (
            <button
              onClick={() => onDownload(movie)}
              className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95 hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))",
                border: "1px solid rgba(34,197,94,0.35)",
                color: "#4ade80",
              }}
              title="Download"
            >
              <Download size={10} />
            </button>
          )}
          <button
            onClick={() => onAddList(movie)}
            className="flex items-center justify-center px-2 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95"
            style={{
              background: inList ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
              border: inList ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.08)",
              color: inList ? "#4ade80" : "#666",
            }}
          >
            {inList ? <Check size={10} /> : <Plus size={10} />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── List Result Item ────────────────────────────────────────────────────────────
const SearchResultListItem: React.FC<CardProps> = ({
  movie, query, index, onWatch, onDownload, hasDownload, inList, onAddList, highlight
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="list-in flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
        border: hovered ? "1px solid rgba(229,9,20,0.2)" : "1px solid rgba(255,255,255,0.04)",
        animationDelay: `${Math.min(index * 25, 300)}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Rank */}
      <div
        className="w-8 flex-shrink-0 text-center font-black text-base"
        style={{ color: index < 3 ? "#E50914" : "#333" }}
      >
        {index + 1}
      </div>

      {/* Poster */}
      <div
        className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 relative"
        style={{ background: "#1a1a1a" }}
        onClick={() => onWatch(movie)}
      >
        {movie.posterUrl
          ? <img src={movie.posterUrl} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><Film size={16} className="text-gray-700" /></div>
        }
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
          style={{ opacity: hovered ? 1 : 0, background: "rgba(0,0,0,0.6)" }}
        >
          <Play size={12} fill="white" className="text-white ml-0.5" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0" onClick={() => onWatch(movie)}>
        <p className="text-white text-sm font-bold leading-tight line-clamp-1">
          {highlight(movie.title, query)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-gray-600 text-xs">{movie.year}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-black"
            style={{
              background: movie.type === "series" ? "rgba(59,130,246,0.2)" : "rgba(229,9,20,0.2)",
              color: movie.type === "series" ? "#60a5fa" : "#f87171",
            }}
          >
            {movie.type === "series" ? "SERIES" : "MOVIE"}
          </span>
          {movie.genre?.slice(0, 2).map(g => (
            <span key={g} className="text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.05)" }}>{g}</span>
          ))}
        </div>
      </div>

      {/* Rating */}
      {movie.rating && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span className="text-yellow-400 text-xs font-black">{movie.rating}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onWatch(movie)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all active:scale-95 hover:brightness-110"
          style={{ background: "white", color: "black" }}
        >
          <Play size={10} fill="black" /> Play
        </button>
        {hasDownload && (
          <button
            onClick={() => onDownload(movie)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95"
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#4ade80",
            }}
            title="Download"
          >
            <Download size={13} />
          </button>
        )}
        <button
          onClick={() => onAddList(movie)}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-95"
          style={{
            background: inList ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
            border: inList ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: inList ? "#4ade80" : "#666",
          }}
        >
          {inList ? <Check size={13} /> : <Plus size={13} />}
        </button>

      </div>
    </div>
  );
};

export default SearchPage;
