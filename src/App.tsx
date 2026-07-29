import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, db2, auth } from "./firebase";
import { Movie } from "./types";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import MoviesPage from "./components/MoviesPage";
import MyListPage from "./components/MyListPage";
import SearchPage from "./components/SearchPage";
import VideoPlayer from "./components/VideoPlayer";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import DownloadPage from "./components/DownloadPage";
import LoadingOverlay from "./components/LoadingOverlay";

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  // Global action loading
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Video Player
  const [watchingMovie, setWatchingMovie] = useState<Movie | null>(null);

  // Download Page
  const [downloadMovie, setDownloadMovie] = useState<Movie | null>(null);

  // My List (stored in localStorage)
  const [myList, setMyList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("kellybox_mylist") || "[]");
    } catch {
      return [];
    }
  });

  // Admin - Firebase Auth based
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Helper: show loading overlay for async actions
  const withLoading = useCallback(
    async (msg: string, fn: () => Promise<void> | void) => {
      setActionMessage(msg);
      setActionLoading(true);
      try {
        await fn();
      } finally {
        // Small delay so the loader feels natural
        setTimeout(() => {
          setActionLoading(false);
          setActionMessage("");
        }, 400);
      }
    },
    []
  );

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setShowAdminPanel(false);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Load movies from BOTH Firebase servers and merge them
  useEffect(() => {
    let movies1: Movie[] = [];
    let movies2: Movie[] = [];
    let loaded1 = false;
    let loaded2 = false;

    const merge = () => {
      // Merge both servers, deduplicate by title+year, tag with server
      const combined = [...movies1, ...movies2];
      const seen = new Set<string>();
      const deduped = combined.filter((m) => {
        const key = `${m.title}-${m.year}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      // Sort by createdAt desc
      deduped.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setMovies(deduped);
      if (loaded1 && loaded2) setLoading(false);
    };

    // Server 1
    const q1 = query(collection(db, "movies"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(
      q1,
      (snapshot) => {
        movies1 = snapshot.docs.map((doc) => ({
          id: `s1_${doc.id}`,
          ...(doc.data() as Omit<Movie, "id">),
          server: 1 as const,
        }));
        loaded1 = true;
        merge();
      },
      (error) => {
        console.error("Server 1 Firestore error:", error);
        loaded1 = true;
        merge();
      }
    );

    // Server 2
    const q2 = query(collection(db2, "movies"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(
      q2,
      (snapshot) => {
        movies2 = snapshot.docs.map((doc) => ({
          id: `s2_${doc.id}`,
          ...(doc.data() as Omit<Movie, "id">),
          server: 2 as const,
        }));
        loaded2 = true;
        merge();
      },
      (error) => {
        console.error("Server 2 Firestore error:", error);
        loaded2 = true;
        merge();
      }
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Save myList to localStorage
  useEffect(() => {
    localStorage.setItem("kellybox_mylist", JSON.stringify(myList));
  }, [myList]);

  // Keyboard shortcut for admin
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        if (isAdmin) {
          setShowAdminPanel(true);
        } else {
          setShowAdminLogin(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin]);

  // Search -> go to movies page
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage("movies");
    }
  }, [searchQuery]);

  // ─── Handlers with loading ───────────────────────────────────

  const handleWatch = useCallback(
    (movie: Movie) => {
      withLoading("Opening player...", () => {
        setWatchingMovie(movie);
      });
    },
    [withLoading]
  );

  // Smart download: if 1 link → open directly, if multiple → show download page
  const openDirectLink = (url: string) => {
    // Always open in new tab directly
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = useCallback(
    (movie: Movie) => {
      const links = movie.downloadLinks || [];
      const singleUrl = movie.downloadUrl;

      // Multiple links → show download page
      if (links.length > 1) {
        withLoading("Loading download options...", () => {
          setDownloadMovie(movie);
        });
        return;
      }

      // Single downloadLink entry → open directly
      if (links.length === 1) {
        withLoading("Opening download...", () => {
          openDirectLink(links[0].url);
        });
        return;
      }

      // Legacy single downloadUrl → open directly
      if (singleUrl) {
        withLoading("Opening download...", () => {
          openDirectLink(singleUrl);
        });
        return;
      }

      // No links → show download page (shows "no links" message)
      withLoading("Loading download options...", () => {
        setDownloadMovie(movie);
      });
    },
    [withLoading]
  );

  const handleAddList = useCallback(
    (movie: Movie) => {
      if (!movie.id) return;
      const inList = myList.includes(movie.id);
      withLoading(inList ? "Removing from list..." : "Adding to list...", () => {
        setMyList((prev) =>
          prev.includes(movie.id!)
            ? prev.filter((id) => id !== movie.id)
            : [...prev, movie.id!]
        );
      });
    },
    [myList, withLoading]
  );

  const handleLoginSuccess = () => {
    withLoading("Signing in...", () => {
      setShowAdminLogin(false);
      setShowAdminPanel(true);
    });
  };

  const handleLogout = async () => {
    await withLoading("Signing out...", async () => {
      await signOut(auth);
      setShowAdminPanel(false);
      setIsAdmin(false);
    });
  };

  const handleAdminClose = () => {
    setShowAdminPanel(false);
  };

  const handleSetPage = (page: string) => {
    withLoading("Loading page...", () => {
      setCurrentPage(page);
      if (page !== "movies" && page !== "series") {
        setSearchQuery("");
      }
    });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q) {
      setCurrentPage("search");
    }
  };

  const handleCloseVideo = useCallback(() => {
    withLoading("Closing player...", () => {
      setWatchingMovie(null);
    });
  }, [withLoading]);

  const handleCloseDownload = useCallback(() => {
    withLoading("Going back...", () => {
      setDownloadMovie(null);
    });
  }, [withLoading]);

  const handleOpenDownloadFromPlayer = useCallback(() => {
    withLoading("Loading download options...", () => {
      setDownloadMovie(watchingMovie);
      setWatchingMovie(null);
    });
  }, [watchingMovie, withLoading]);

  const handleWatchFromDownload = useCallback(() => {
    withLoading("Opening player...", () => {
      setWatchingMovie(downloadMovie);
      setDownloadMovie(null);
    });
  }, [downloadMovie, withLoading]);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return (
          <HomePage
            movies={movies}
            onWatch={handleWatch}
            onAddList={handleAddList}
            myList={myList}
            onDownload={handleDownload}
          />
        );
      case "movies":
        return (
          <MoviesPage
            movies={movies}
            type="movie"
            onWatch={handleWatch}
            onAddList={handleAddList}
            myList={myList}
            searchQuery={searchQuery}
            onDownload={handleDownload}
          />
        );
      case "series":
        return (
          <MoviesPage
            movies={movies}
            type="series"
            onWatch={handleWatch}
            onAddList={handleAddList}
            myList={myList}
            searchQuery={searchQuery}
            onDownload={handleDownload}
          />
        );
      case "mylist":
        return (
          <MyListPage
            movies={movies}
            myList={myList}
            onWatch={handleWatch}
            onAddList={handleAddList}
            onDownload={handleDownload}
          />
        );
      case "search":
        return (
          <SearchPage
            movies={movies}
            initialQuery={searchQuery}
            onSearch={handleSearch}
            onWatch={handleWatch}
            onDownload={handleDownload}
            myList={myList}
            onAddList={handleAddList}
          />
        );
      default:
        return (
          <HomePage
            movies={movies}
            onWatch={handleWatch}
            onAddList={handleAddList}
            myList={myList}
            onDownload={handleDownload}
          />
        );
    }
  };

  // ─── Initial site loading screen ─────────────────────────────
  if (loading || !authChecked) {
    return (
      <div className="fixed inset-0 bg-[#141414] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="text-[#E50914] font-black text-5xl tracking-widest animate-pulse select-none">
            KELLYBOX
          </div>

          {/* Spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E50914] border-r-[#E50914]/50 animate-spin" />
            <div className="absolute inset-2 rounded-full bg-[#E50914]/10 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-[#E50914]" />
            </div>
          </div>

          <p className="text-gray-400 text-sm animate-pulse">Loading content...</p>

          {/* Progress bar */}
          <div className="w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#E50914] to-[#ff6b6b] rounded-full"
              style={{ animation: "loading-bar 1.5s ease-in-out infinite" }}
            />
          </div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 70%; margin-left: 15%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      {/* Global Action Loading Overlay */}
      <LoadingOverlay visible={actionLoading} message={actionMessage} />

      {/* Navbar */}
      <Navbar
        currentPage={currentPage}
        setCurrentPage={handleSetPage}
        searchQuery={searchQuery}
        setSearchQuery={handleSearch}
      />

      {/* Main Content */}
      {renderPage()}

      {/* Admin Button (bottom right) */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-2">
        {isAdmin && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-900/80 hover:bg-red-800 border border-red-700 text-red-200 hover:text-white px-3 py-2 rounded-lg text-xs transition-colors shadow-lg"
            title="Sign Out"
          >
            <span>🚪</span>
            <span className="hidden md:inline">Sign Out</span>
          </button>
        )}
        <button
          onClick={() => {
            if (isAdmin) {
              withLoading("Opening admin panel...", () => setShowAdminPanel(true));
            } else {
              setShowAdminLogin(true);
            }
          }}
          className={`flex items-center gap-2 border text-xs transition-colors shadow-lg px-3 py-2 rounded-lg ${
            isAdmin
              ? "bg-[#E50914]/20 hover:bg-[#E50914]/30 border-[#E50914]/50 text-[#E50914] hover:text-white"
              : "bg-[#1f1f1f] hover:bg-[#2a2a2a] border-gray-800 text-gray-400 hover:text-white"
          }`}
          title="Admin Panel (Ctrl+Shift+A)"
        >
          <span>⚙️</span>
          <span className="hidden md:inline">{isAdmin ? "Admin Panel" : "Admin"}</span>
        </button>
      </div>

      {/* Video Player */}
      {watchingMovie && (
        <VideoPlayer
          movie={watchingMovie}
          allMovies={movies}
          onClose={handleCloseVideo}
          onAddList={handleAddList}
          myList={myList}
          onOpenDownload={handleOpenDownloadFromPlayer}
          onWatch={handleWatch}
        />
      )}

      {/* Download Page */}
      {downloadMovie && (
        <DownloadPage
          movie={downloadMovie}
          onClose={handleCloseDownload}
          onWatch={handleWatchFromDownload}
        />
      )}

      {/* Admin Login */}
      {showAdminLogin && (
        <AdminLogin
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAdminLogin(false)}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && isAdmin && (
        <AdminPanel movies={movies} onClose={handleAdminClose} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
