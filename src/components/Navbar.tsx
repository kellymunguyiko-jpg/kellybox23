import { useState, useEffect, useRef } from "react";
import { Search, Bell, ChevronDown, Menu, X } from "lucide-react";

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const NAV_ITEMS = ["Home", "Movies", "Series", "My List"];

const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync external query
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        if (!localQuery) setSearchOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [localQuery]);

  const openSearch = () => {
    setSearchOpen(true);
    setCurrentPage("search");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleQueryChange = (val: string) => {
    setLocalQuery(val);
    setSearchQuery(val);
    if (val && currentPage !== "search") {
      setCurrentPage("search");
    }
  };

  const handleClearSearch = () => {
    setLocalQuery("");
    setSearchQuery("");
    setSearchOpen(false);
    setSearchFocused(false);
  };

  const handleNavClick = (item: string) => {
    const page = item.toLowerCase().replace(" ", "");
    setCurrentPage(page);
    setMobileOpen(false);
    if (page !== "search") {
      setSearchOpen(false);
      setLocalQuery("");
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0f0f0f]/98 backdrop-blur-md shadow-2xl shadow-black/50"
          : "bg-gradient-to-b from-black/90 via-black/50 to-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4">
        {/* ── Logo ── */}
        <div className="flex items-center gap-6 md:gap-10">
          <button
            onClick={() => handleNavClick("Home")}
            className="text-[#E50914] font-black text-2xl md:text-3xl tracking-widest cursor-pointer select-none hover:scale-105 transition-transform duration-200 drop-shadow-lg"
          >
            KELLYBOX
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const page = item.toLowerCase().replace(" ", "");
              const active = currentPage === page;
              return (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 rounded-lg group ${
                    active ? "text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#E50914] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* ── Animated Search ── */}
          <div ref={searchRef} className="relative flex items-center">
            <div
              className={`flex items-center overflow-hidden transition-all duration-500 ease-in-out rounded-full ${
                searchOpen
                  ? "w-52 md:w-72 bg-[#1a1a1a] border border-gray-600 pl-4 pr-2 py-2 shadow-xl"
                  : "w-9 h-9 bg-transparent border border-transparent"
              } ${searchFocused ? "border-[#E50914] shadow-[0_0_15px_rgba(229,9,20,0.2)]" : ""}`}
            >
              {/* Search Icon Button */}
              <button
                onClick={searchOpen ? undefined : openSearch}
                className={`flex-shrink-0 transition-all duration-300 ${
                  searchOpen ? "text-gray-400" : "text-white hover:text-gray-300 w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10"
                }`}
              >
                <Search
                  size={searchOpen ? 16 : 19}
                  className={`transition-all duration-300 ${currentPage === "search" ? "text-[#E50914]" : ""}`}
                />
              </button>

              {/* Input — only visible when open */}
              {searchOpen && (
                <input
                  ref={inputRef}
                  value={localQuery}
                  onChange={e => handleQueryChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  onKeyDown={e => {
                    if (e.key === "Escape") handleClearSearch();
                    if (e.key === "Enter" && currentPage !== "search") setCurrentPage("search");
                  }}
                  placeholder="Search titles..."
                  className="flex-1 bg-transparent text-white text-sm outline-none ml-2 placeholder-gray-600 min-w-0"
                />
              )}

              {/* Clear button */}
              {searchOpen && (
                <button
                  onClick={handleClearSearch}
                  className="flex-shrink-0 ml-1 text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search page indicator dot */}
            {currentPage === "search" && !searchOpen && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#E50914]" />
            )}
          </div>

          {/* Bell */}
          <button className="hidden md:flex w-9 h-9 items-center justify-center rounded-full hover:bg-white/10 transition-colors relative">
            <Bell size={19} className="text-white" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E50914] rounded-full border border-[#0f0f0f]" />
          </button>

          {/* Avatar */}
          <button className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E50914] to-red-800 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
              K
            </div>
            <ChevronDown size={14} className="text-white hidden md:block group-hover:text-gray-300 transition-colors" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-[#0f0f0f]/98 backdrop-blur-md border-t border-gray-800 px-4 py-4 flex flex-col gap-1">
          {/* Mobile search */}
          <div className="flex items-center bg-[#1e1e1e] border border-gray-700 rounded-xl px-4 py-3 mb-3">
            <Search size={16} className="text-gray-500 mr-3" />
            <input
              value={localQuery}
              onChange={e => { handleQueryChange(e.target.value); setCurrentPage("search"); }}
              placeholder="Search titles..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
            />
            {localQuery && (
              <button onClick={handleClearSearch}>
                <X size={14} className="text-gray-500" />
              </button>
            )}
          </div>

          {/* Mobile nav links */}
          {NAV_ITEMS.map(item => {
            const page = item.toLowerCase().replace(" ", "");
            const active = currentPage === page;
            return (
              <button
                key={item}
                onClick={() => handleNavClick(item)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#E50914]/15 text-white border border-[#E50914]/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
