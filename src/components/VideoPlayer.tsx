import {
  X, Plus, Star, Download, ExternalLink,
  Youtube, ChevronDown, ChevronUp, HardDrive, Play, CheckCircle,
  SkipForward, Zap, Film, ArrowLeft, Clock, Tag, Share2, ThumbsUp,
  Copy, Check, Facebook, Twitter, MessageCircle,
} from "lucide-react";
import { Movie } from "../types";
import { useState, useRef, useEffect, useCallback } from "react";

interface VideoPlayerProps {
  movie: Movie;
  allMovies?: Movie[];
  onClose: () => void;
  onAddList: (movie: Movie) => void;
  myList: string[];
  onOpenDownload?: () => void;
  onWatch?: (movie: Movie) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────
const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/
  );
  return match ? match[1] : null;
};

const getMegaEmbedUrl = (url: string): string => {
  if (url.includes("mega.nz/embed")) return url;
  if (url.includes("mega.nz/file/")) {
    const parts = url.replace("https://mega.nz/file/", "");
    return `https://mega.nz/embed/${parts}`;
  }
  if (url.includes("mega.nz/#!")) {
    const parts = url.split("#!")[1];
    return `https://mega.nz/embed#!${parts}`;
  }
  return url;
};

type LinkType = "youtube" | "mega" | "direct" | "mediafire" | "gdrive";

const getLinkType = (url: string): LinkType => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("mega.nz")) return "mega";
  if (url.includes("mediafire.com")) return "mediafire";
  if (url.includes("drive.google.com")) return "gdrive";
  return "direct";
};

const getDirectOpenUrl = (url: string): string => {
  const type = getLinkType(url);
  if (type === "youtube") {
    const id = getYouTubeId(url);
    return id ? `https://www.youtube.com/watch?v=${id}` : url;
  }
  if (type === "mega") return url.replace("mega.nz/embed/", "mega.nz/file/");
  if (type === "mediafire") return url; // MediaFire opens directly
  if (type === "gdrive") {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    return url;
  }
  return url;
};

const openInNewTab = (url: string) => {
  window.open(getDirectOpenUrl(url), "_blank", "noopener,noreferrer");
};

const qualityColors: Record<string, string> = {
  "4k": "bg-purple-600 text-white",
  "2160p": "bg-purple-600 text-white",
  "1080p": "bg-blue-600 text-white",
  "fhd": "bg-blue-600 text-white",
  "hd": "bg-blue-500 text-white",
  "720p": "bg-green-600 text-white",
  "480p": "bg-yellow-600 text-white",
  "360p": "bg-orange-600 text-white",
  "sd": "bg-orange-500 text-white",
};

const getQualityColor = (label: string): string => {
  const lower = label.toLowerCase();
  for (const key of Object.keys(qualityColors)) {
    if (lower.includes(key)) return qualityColors[key];
  }
  return "bg-gray-700 text-white";
};

// ─── Share Modal ──────────────────────────────────────────────────
const ShareModal = ({
  movie,
  onClose,
}: {
  movie: Movie;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;
  const shareTitle = `Watch "${movie.title}" on KellyBox 🎬`;


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle size={20} className="text-green-400" />,
      color: "hover:bg-green-500/10 border-green-500/20",
      action: () =>
        window.open(
          `https://wa.me/?text=${encodeURIComponent(shareTitle + "\n" + shareUrl)}`,
          "_blank"
        ),
    },
    {
      name: "Facebook",
      icon: <Facebook size={20} className="text-blue-400" />,
      color: "hover:bg-blue-500/10 border-blue-500/20",
      action: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank"
        ),
    },
    {
      name: "Twitter / X",
      icon: <Twitter size={20} className="text-sky-400" />,
      color: "hover:bg-sky-500/10 border-sky-500/20",
      action: () =>
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank"
        ),
    },
    {
      name: "Telegram",
      icon: (
        <svg viewBox="0 0 24 24" width={20} height={20} fill="#38bdf8">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
        </svg>
      ),
      color: "hover:bg-sky-400/10 border-sky-400/20",
      action: () =>
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
          "_blank"
        ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative z-10 bg-[#181818] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#E50914]" />
            <h3 className="text-white font-bold text-sm">Share this movie</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Movie preview */}
        <div className="px-5 py-3 flex items-center gap-3 bg-white/3 border-b border-white/5">
          {movie.posterUrl && (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{movie.title}</p>
            <p className="text-gray-500 text-xs">{movie.year} • ⭐ {movie.rating}</p>
          </div>
        </div>

        {/* Share options */}
        <div className="p-4 grid grid-cols-2 gap-2">
          {shareOptions.map((opt) => (
            <button
              key={opt.name}
              onClick={() => { opt.action(); }}
              className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/5 ${opt.color} transition-all active:scale-95`}
            >
              {opt.icon}
              <span className="text-white text-xs font-semibold">{opt.name}</span>
            </button>
          ))}
        </div>

        {/* Copy link */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent text-gray-400 text-xs outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 flex-shrink-0 ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-white/10 hover:bg-white/15 text-white"
              }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movie,
  allMovies = [],
  onClose,
  onAddList,
  myList,
  onWatch,
}) => {
  const inList = myList.includes(movie.id || "");
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const [showNextMovie, setShowNextMovie] = useState(false);
  const [nextCancelled, setNextCancelled] = useState(false);
  const [nextCountdown, setNextCountdown] = useState(10);
  const [liked, setLiked] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showShareModal, setShowShareModal] = useState(false);
  // Thumbnail overlay — show before user clicks play
  const thumbnailSrc = movie.thumbnailUrl || movie.backdropUrl || movie.posterUrl;
  const [isPlaying, setIsPlaying] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoNextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasMultiLinks = (movie.downloadLinks?.length || 0) > 0;
  const hasSingleLink = !!movie.downloadUrl;
  const hasAnyDownload = hasMultiLinks || hasSingleLink;
  const downloadCount = movie.downloadLinks?.length || (hasSingleLink ? 1 : 0);

  // Similar movies (sidebar) — same genre or type
  const similarMovies = allMovies
    .filter((m) => m.id !== movie.id)
    .sort((a, b) => {
      const aMatch = a.genre?.some((g) => movie.genre?.includes(g)) ? 1 : 0;
      const bMatch = b.genre?.some((g) => movie.genre?.includes(g)) ? 1 : 0;
      return bMatch - aMatch;
    });

  // Categories for sidebar filter
  const allGenres = ["All", ...Array.from(new Set(allMovies.flatMap((m) => m.genre || [])))];

  const filteredSimilar =
    activeCategory === "All"
      ? similarMovies
      : similarMovies.filter((m) => m.genre?.includes(activeCategory));

  // Next movie
  const nextMovie =
    allMovies.find((m) => m.id !== movie.id && m.type === movie.type) ||
    allMovies.find((m) => m.id !== movie.id);

  // Download handler
  const handleDownload = useCallback((url: string, idx?: number) => {
    openInNewTab(url);
    if (idx !== undefined) {
      setClickedIdx(idx);
      setTimeout(() => setClickedIdx(null), 3000);
    }
  }, []);

  // Cancel next — permanently stop for this session
  const handleCancelNext = useCallback(() => {
    setShowNextMovie(false);
    setNextCancelled(true); // ← never show again
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
  }, []);

  // Auto-next: only trigger if NOT cancelled
  useEffect(() => {
    if (nextCancelled) return; // user said no → never again
    autoNextTimerRef.current = setTimeout(() => {
      if (nextMovie && !nextCancelled) setShowNextMovie(true);
    }, 25000);
    return () => {
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    };
  }, [nextMovie, nextCancelled]);

  // Countdown
  useEffect(() => {
    if (!showNextMovie) { setNextCountdown(10); return; }
    setNextCountdown(10);
    countdownRef.current = setInterval(() => {
      setNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          if (nextMovie && onWatch) onWatch(nextMovie);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [showNextMovie, nextMovie, onWatch]);

  // Reset cancel state and playing state when movie changes
  useEffect(() => {
    setNextCancelled(false);
    setShowNextMovie(false);
    setNextCountdown(10);
    setIsPlaying(false); // reset thumbnail overlay for new movie
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
  }, [movie.id]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [movie.id]);

  // Share handler — use native Web Share API if available, else open modal
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Watch "${movie.title}" on KellyBox`,
          text: movie.description?.slice(0, 100) || "",
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled native share → fallback to modal
      }
    }
    setShowShareModal(true);
  };

  // Render video iframe
  const renderVideo = () => {
    const url = movie.videoUrl;

    // ── YouTube ──
    if (movie.videoType === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = getYouTubeId(url);
      const embedUrl = videoId
        ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
        : url;
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title={movie.title}
        />
      );
    }

    // ── Mega.nz ──
    if (movie.videoType === "mega" || url.includes("mega.nz")) {
      const embedUrl = getMegaEmbedUrl(url);
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          title={movie.title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      );
    }

    // ── Google Drive ──
    if (movie.videoType === "gdrive" || url.includes("drive.google.com")) {
      const fileMatch = url.match(/\/d\/([^/]+)/);
      const fileId = fileMatch ? fileMatch[1] : null;
      const embedUrl = fileId
        ? `https://drive.google.com/file/d/${fileId}/preview`
        : url;
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          title={movie.title}
        />
      );
    }

    // ── MediaFire ──
    if (movie.videoType === "mediafire" || url.includes("mediafire.com")) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0d1220] via-[#0a0f1a] to-[#060a10] relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }} />
          </div>

          {/* MediaFire Logo Area */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6, #60a5fa)" }}>
                <span className="text-5xl">🔵</span>
              </div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-3xl animate-ping opacity-20" style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }} />
            </div>

            {/* Title */}
            <div>
              <h3 className="text-white text-2xl font-black mb-1 tracking-tight">MediaFire</h3>
              <p className="text-blue-400 text-sm font-medium">Streaming via MediaFire</p>
            </div>

            {/* Movie info */}
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 w-full max-w-sm">
              <p className="text-white font-bold text-base mb-1">{movie.title}</p>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                <span>{movie.year}</span>
                <span>•</span>
                <span className="text-yellow-400">⭐ {movie.rating}</span>
                <span>•</span>
                <span>{movie.duration}</span>
              </div>
            </div>

            {/* Open button */}
            <button
              onClick={() => window.open(url, "_blank")}
              className="group relative px-10 py-4 rounded-2xl text-white font-black text-base tracking-wide transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1d4ed8, #3b82f6)" }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "linear-gradient(135deg, #2563eb, #60a5fa)" }} />
              <span className="relative flex items-center gap-3">
                <span className="text-xl">▶</span>
                Watch on MediaFire
              </span>
            </button>

            {/* Steps */}
            <div className="w-full max-w-sm space-y-2">
              {[
                { icon: "1️⃣", text: "Click the button above" },
                { icon: "2️⃣", text: "MediaFire opens in a new tab" },
                { icon: "3️⃣", text: 'Click "Watch" or "Download" on MediaFire' },
              ].map((step) => (
                <div key={step.icon} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-base">{step.icon}</span>
                  <span className="text-gray-300 text-xs">{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── Direct URL / MP4 ──
    return (
      <video
        src={url}
        controls
        autoPlay
        className="w-full h-full"
        onEnded={() => { if (nextMovie && !nextCancelled) setShowNextMovie(true); }}
      >
        Your browser does not support the video tag.
      </video>
    );
  };

  return (
    <>
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal movie={movie} onClose={() => setShowShareModal(false)} />
      )}

      <div className="fixed inset-0 z-50 bg-[#0f0f0f] overflow-y-auto">
        {/* ── Ambient light effect behind video ── */}
        <div
          className="fixed top-0 left-0 right-0 h-[60vh] pointer-events-none z-0 opacity-20 blur-3xl"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, #E50914 0%, transparent 70%)`,
          }}
        />

        {/* ── Top Bar ── */}
        <div className="sticky top-0 z-40 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
              <ArrowLeft size={16} />
            </div>
            <span className="text-sm font-medium hidden sm:inline">Back</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-sm sm:text-base truncate">{movie.title}</h1>
            <p className="text-gray-500 text-xs truncate">{movie.year} • {movie.type === "series" ? "Series" : "Movie"}</p>
          </div>
          <div className="flex items-center gap-2">
            {hasAnyDownload && (
              <button
                onClick={() => setShowDownloadPanel(!showDownloadPanel)}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Download</span>
                {downloadCount > 1 && (
                  <span className="bg-green-800 text-green-200 text-[9px] px-1 rounded-full">{downloadCount}</span>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Download Panel (dropdown from header) ── */}
        {showDownloadPanel && hasAnyDownload && (
          <div className="relative z-30 bg-[#111] border-b border-green-900/40 px-4 py-4">
            <div className="max-w-5xl mx-auto">
              <p className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
                <Download size={14} />
                Download — {downloadCount} {downloadCount === 1 ? "option" : "options"} available
              </p>
              {hasMultiLinks && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {movie.downloadLinks!.map((dl, i) => {
                    const type = getLinkType(dl.url);
                    const clicked = clickedIdx === i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleDownload(dl.url, i)}
                        className={`flex flex-col gap-1.5 border rounded-xl px-3 py-2.5 text-left transition-all active:scale-95 ${
                          clicked
                            ? "border-green-500 bg-green-900/30"
                            : "border-white/10 bg-white/5 hover:border-green-500/50 hover:bg-green-900/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getQualityColor(dl.label)}`}>
                            {dl.label}
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${
                            type === "youtube" ? "bg-red-900/60 text-red-300" :
                            type === "mega" ? "bg-orange-900/40 text-orange-300" :
                            "bg-green-900/40 text-green-300"
                          }`}>
                            {type === "youtube" ? "YT" : type === "mega" ? "Mega" : "Direct"}
                          </span>
                        </div>
                        {dl.size && (
                          <span className="text-[9px] text-gray-500">{dl.size}</span>
                        )}
                        <div className={`flex items-center gap-1 text-[10px] font-semibold ${clicked ? "text-green-300" : "text-green-400"}`}>
                          {clicked ? <><CheckCircle size={10} /> Opening...</> : <><Download size={10} /> Download</>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {hasSingleLink && !hasMultiLinks && (
                <button
                  onClick={() => handleDownload(movie.downloadUrl!)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-2.5 rounded-xl transition-all active:scale-95"
                >
                  <Download size={16} />
                  {movie.downloadLabel || "Download Full Movie"}
                  <ExternalLink size={12} className="opacity-60" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Main Layout: Video + Sidebar ── */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 py-4">
          <div className="flex flex-col xl:flex-row gap-4">

            {/* ── LEFT: Video + Info + Download ── */}
            <div className="flex-1 min-w-0">

              {/* ── Video Container with ambient glow ── */}
              <div className="relative">
                {/* Ambient glow */}
                <div
                  className="absolute -inset-2 rounded-2xl opacity-30 blur-xl pointer-events-none z-0"
                  style={{
                    backgroundImage: movie.backdropUrl
                      ? `url(${movie.backdropUrl})`
                      : "linear-gradient(135deg, #E50914, #ff6b35)",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                {/* Video with Thumbnail Overlay */}
                <div className="relative z-10 w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl shadow-black/80 ring-1 ring-white/10">
                  {/* Thumbnail overlay — shows before user clicks play */}
                  {!isPlaying && thumbnailSrc ? (
                    <div
                      className="absolute inset-0 z-20 cursor-pointer group"
                      onClick={() => setIsPlaying(true)}
                    >
                      {/* Thumbnail image */}
                      <img
                        src={thumbnailSrc}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                          setIsPlaying(true);
                        }}
                      />
                      {/* Dark gradient overlay */}
                      <div
                        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-80"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.2) 100%)" }}
                      />
                      {/* Play button center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        {/* Outer ring pulse */}
                        <div className="relative">
                          <div
                            className="absolute inset-0 rounded-full animate-ping opacity-30"
                            style={{ background: "#E50914", transform: "scale(1.4)" }}
                          />
                          <div
                            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 group-hover:scale-110"
                            style={{ background: "linear-gradient(135deg, #E50914 0%, #ff4444 100%)", border: "3px solid rgba(255,255,255,0.3)" }}
                          >
                            <Play size={28} className="text-white ml-1" fill="white" />
                          </div>
                        </div>
                        {/* Play text */}
                        <div className="text-center">
                          <p className="text-white font-bold text-sm sm:text-base drop-shadow-lg">Click to Play</p>
                          <p className="text-gray-300 text-xs mt-0.5 drop-shadow">{movie.title}</p>
                        </div>
                      </div>

                      {/* Bottom info bar */}
                      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-xs font-bold bg-[#E50914] px-2 py-0.5 rounded">
                            {movie.type === "series" ? "SERIES" : "MOVIE"}
                          </span>
                          <span className="text-gray-300 text-xs">{movie.year}</span>
                          <span className="text-yellow-400 text-xs flex items-center gap-0.5 font-semibold">
                            <Star size={10} fill="currentColor" /> {movie.rating}
                          </span>
                          {movie.duration && (
                            <span className="text-gray-400 text-xs flex items-center gap-1">
                              <Clock size={10} /> {movie.duration}
                            </span>
                          )}
                        </div>
                        {/* Thumbnail badge */}
                        {movie.thumbnailUrl && (
                          <span className="text-[10px] bg-purple-600/80 text-white px-2 py-0.5 rounded-full font-medium">
                            Custom Thumbnail
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Actual video — only rendered when playing */}
                  {isPlaying || !thumbnailSrc ? (
                    <div className="w-full h-full">
                      {renderVideo()}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* ── Movie Title & Actions ── */}
              <div className="mt-4 px-1">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-white font-bold text-xl sm:text-2xl leading-tight">{movie.title}</h1>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-gray-400 text-sm">{movie.year}</span>
                      <span className="text-gray-700">•</span>
                      <span className="text-yellow-400 flex items-center gap-1 text-sm font-semibold">
                        <Star size={13} fill="currentColor" /> {movie.rating}
                      </span>
                      <span className="text-gray-700">•</span>
                      {movie.duration && (
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Clock size={12} /> {movie.duration}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        movie.type === "series" ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" : "bg-[#E50914]/20 text-[#E50914] border border-[#E50914]/30"
                      }`}>
                        {movie.type === "series" ? "SERIES" : "MOVIE"}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        liked ? "bg-[#E50914] text-white" : "bg-white/10 hover:bg-white/15 text-gray-300"
                      }`}
                    >
                      <ThumbsUp size={14} fill={liked ? "white" : "none"} />
                      <span className="hidden sm:inline">Like</span>
                    </button>
                    <button
                      onClick={() => onAddList(movie)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                        inList ? "bg-white text-black" : "bg-white/10 hover:bg-white/15 text-gray-300"
                      }`}
                    >
                      {inList ? <CheckCircle size={14} /> : <Plus size={14} />}
                      <span className="hidden sm:inline">{inList ? "In List" : "My List"}</span>
                    </button>
                    {/* ── SHARE BUTTON ── */}
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-all active:scale-95"
                    >
                      <Share2 size={14} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>

                {/* Genre tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(movie.genre || []).map((g) => (
                    <span key={g} className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-2.5 py-1 rounded-full border border-white/10 transition-colors cursor-default">
                      <Tag size={9} /> {g}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed mt-3 border-t border-white/5 pt-3">
                  {movie.description}
                </p>
              </div>

              {/* ── Download Section (always visible below video) ── */}
              {hasAnyDownload && (
                <div className="mt-4 bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
                  {/* Header toggle */}
                  <button
                    onClick={() => setShowDownloadPanel(!showDownloadPanel)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-green-600/20 border border-green-600/30 flex items-center justify-center">
                        <Download size={16} className="text-green-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-bold text-sm">Download Full Movie</p>
                        <p className="text-gray-500 text-xs">
                          {downloadCount} {downloadCount === 1 ? "quality" : "qualities"} available
                          {hasMultiLinks && ` • ${movie.downloadLinks?.map(d => d.label).join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs font-bold hidden sm:inline">
                        {showDownloadPanel ? "Hide" : "Show options"}
                      </span>
                      {showDownloadPanel ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Download options */}
                  {showDownloadPanel && (
                    <div className="border-t border-white/5 px-5 py-4">
                      {hasMultiLinks ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {movie.downloadLinks!.map((dl, i) => {
                            const type = getLinkType(dl.url);
                            const clicked = clickedIdx === i;
                            return (
                              <button
                                key={i}
                                onClick={() => handleDownload(dl.url, i)}
                                className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-all active:scale-95 group ${
                                  clicked
                                    ? "border-green-500 bg-green-900/20"
                                    : "border-white/10 bg-white/3 hover:border-green-500/60 hover:bg-green-900/10"
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  type === "youtube" ? "bg-red-600/20" :
                                  type === "mega" ? "bg-orange-600/20" :
                                  "bg-green-600/20"
                                }`}>
                                  {type === "youtube" ? (
                                    <Youtube size={18} className="text-red-400" />
                                  ) : type === "mega" ? (
                                    <Zap size={18} className="text-orange-400" />
                                  ) : (
                                    <HardDrive size={18} className="text-green-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-black px-2 py-0.5 rounded ${getQualityColor(dl.label)}`}>
                                      {dl.label}
                                    </span>
                                  </div>
                                  {dl.size && (
                                    <p className="text-gray-500 text-xs mt-0.5">{dl.size}</p>
                                  )}
                                  <p className="text-xs text-gray-600 mt-0.5 capitalize">{type}</p>
                                </div>
                                <div className={`flex-shrink-0 transition-colors ${clicked ? "text-green-400" : "text-gray-600 group-hover:text-green-400"}`}>
                                  {clicked ? <CheckCircle size={18} /> : <Download size={18} />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <button
                            onClick={() => handleDownload(movie.downloadUrl!)}
                            className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95 w-full sm:w-auto"
                          >
                            <Download size={18} />
                            {movie.downloadLabel || "Download Full Movie"}
                            <ExternalLink size={14} className="opacity-70" />
                          </button>
                          <p className="text-gray-500 text-xs">
                            {getLinkType(movie.downloadUrl!) === "mega"
                              ? "Opens on Mega.nz — click the download button there"
                              : getLinkType(movie.downloadUrl!) === "youtube"
                              ? "Opens YouTube — use y2mate.com or 9xbuddy.in to download"
                              : "Direct file download"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Next Movie suggestion (mobile) ── */}
              {showNextMovie && nextMovie && (
                <div className="xl:hidden mt-4 bg-[#1a1a1a] rounded-2xl border border-[#E50914]/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[#E50914] text-xs font-bold flex items-center gap-1.5">
                      <SkipForward size={12} /> Up Next in {nextCountdown}s
                    </p>
                    <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E50914] rounded-full transition-all duration-1000"
                        style={{ width: `${((10 - nextCountdown) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={nextMovie.posterUrl}
                      alt={nextMovie.title}
                      className="w-16 aspect-[2/3] object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/80x120/1a1a1a/444?text=N/A"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{nextMovie.title}</p>
                      <p className="text-gray-500 text-xs">{nextMovie.year} • ⭐ {nextMovie.rating}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => { if (onWatch) onWatch(nextMovie); }}
                        className="flex items-center gap-1 bg-white text-black text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95"
                      >
                        <Play size={11} fill="black" /> Watch
                      </button>
                      <button
                        onClick={handleCancelNext}
                        className="text-gray-500 hover:text-red-400 text-xs text-center transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div className="xl:w-[380px] flex-shrink-0">

              {/* Auto-next (desktop) */}
              {showNextMovie && nextMovie && (
                <div className="mb-4 bg-[#1a1a1a] rounded-2xl border border-[#E50914]/30 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[#E50914] text-xs font-bold flex items-center gap-1.5">
                      <SkipForward size={12} /> Up Next
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#E50914] rounded-full transition-all duration-1000"
                          style={{ width: `${((10 - nextCountdown) / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">{nextCountdown}s</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src={nextMovie.posterUrl}
                      alt={nextMovie.title}
                      className="w-14 aspect-[2/3] object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/60x90/1a1a1a/444?text=N/A"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{nextMovie.title}</p>
                      <p className="text-gray-500 text-xs">{nextMovie.year}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { if (onWatch) onWatch(nextMovie); }}
                          className="flex items-center gap-1 bg-white text-black text-xs font-bold px-3 py-1 rounded-lg active:scale-95"
                        >
                          <Play size={10} fill="black" /> Watch Now
                        </button>
                        <button
                          onClick={handleCancelNext}
                          className="text-gray-500 hover:text-red-400 text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Category chips ── */}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                {allGenres.slice(0, 10).map((g) => (
                  <button
                    key={g}
                    onClick={() => setActiveCategory(g)}
                    className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                      activeCategory === g
                        ? "bg-white text-black"
                        : "bg-white/10 text-gray-300 hover:bg-white/15"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* ── Similar movies list (YouTube-style) ── */}
              <div className="flex flex-col gap-2">
                {filteredSimilar.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <Film size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No similar movies found</p>
                  </div>
                ) : (
                  filteredSimilar.slice(0, 20).map((m) => (
                    <div
                      key={m.id}
                      className="group flex gap-3 rounded-xl p-2 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => onWatch && onWatch(m)}
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0 w-[160px] aspect-video rounded-lg overflow-hidden bg-gray-900">
                        <img
                          src={m.backdropUrl || m.posterUrl}
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/160x90/1a1a1a/444?text=No+Image";
                          }}
                        />
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                            <Play size={14} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                        {/* Type badge */}
                        <div className="absolute top-1 left-1">
                          <span className={`text-[8px] font-black px-1 py-0.5 rounded ${
                            m.type === "series" ? "bg-blue-600" : "bg-[#E50914]"
                          } text-white`}>
                            {m.type === "series" ? "S" : "M"}
                          </span>
                        </div>
                        {/* Download badge */}
                        {(m.downloadLinks?.length || m.downloadUrl) && (
                          <div
                            className="absolute bottom-1 right-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = m.downloadLinks?.[0]?.url || m.downloadUrl;
                              if (url) openInNewTab(url);
                            }}
                          >
                            <span className="flex items-center gap-0.5 text-[8px] font-bold bg-green-600/90 text-white px-1 py-0.5 rounded hover:bg-green-500 transition-colors">
                              <Download size={7} /> DL
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 py-0.5">
                        <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-gray-100">
                          {m.title}
                        </p>
                        <p className="text-gray-500 text-[10px] mt-1">{m.year}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star size={9} className="text-yellow-400" fill="currentColor" />
                          <span className="text-yellow-400 text-[10px] font-medium">{m.rating}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(m.genre || []).slice(0, 2).map((g) => (
                            <span key={g} className="text-[8px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </>
  );
};

export default VideoPlayer;
