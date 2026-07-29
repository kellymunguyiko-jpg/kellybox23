import { useState } from "react";
import {
  X,
  Download,
  ExternalLink,
  Film,
  Star,
  Clock,
  Calendar,
  Tag,
  Shield,
  Wifi,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Play,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Movie, DownloadLink } from "../types";

interface DownloadPageProps {
  movie: Movie;
  onClose: () => void;
  onWatch: () => void;
}

type LinkTypeAll = "mega" | "youtube" | "direct" | "gdrive" | "mediafire";

const getLinkType = (url: string): LinkTypeAll => {
  if (url.includes("mega.nz")) return "mega";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("drive.google.com")) return "gdrive";
  if (url.includes("mediafire.com")) return "mediafire";
  return "direct";
};

const getYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/
  );
  return match ? match[1] : null;
};

// Always returns the real, direct URL to open in new tab
const getDirectUrl = (link: DownloadLink): string => {
  const type = link.type || getLinkType(link.url);

  if (type === "youtube") {
    const id = getYouTubeId(link.url);
    return id ? `https://www.youtube.com/watch?v=${id}` : link.url;
  }

  if (type === "mega") {
    // Convert embed URL to file URL so Mega opens the download page
    let href = link.url;
    href = href.replace("mega.nz/embed/", "mega.nz/file/");
    return href;
  }

  if (type === "mediafire") {
    // MediaFire URLs open directly — just return as-is
    return link.url;
  }

  if (type === "gdrive") {
    // Convert Google Drive view URL to download URL
    const fileMatch = link.url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileMatch) return `https://drive.google.com/uc?export=download&id=${fileMatch[1]}`;
    return link.url;
  }

  return link.url;
};

const qualityColor = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes("4k") || l.includes("2160")) return "text-purple-400 border-purple-500/50 bg-purple-900/20";
  if (l.includes("1080") || l.includes("fhd") || l.includes("full hd")) return "text-blue-400 border-blue-500/50 bg-blue-900/20";
  if (l.includes("720") || l.includes("hd")) return "text-green-400 border-green-500/50 bg-green-900/20";
  if (l.includes("480") || l.includes("sd")) return "text-yellow-400 border-yellow-500/50 bg-yellow-900/20";
  if (l.includes("360") || l.includes("low")) return "text-orange-400 border-orange-500/50 bg-orange-900/20";
  return "text-gray-300 border-gray-600 bg-gray-800/50";
};

const getLinkIcon = (type: string) => {
  if (type === "mega") return "☁️";
  if (type === "youtube") return "▶️";
  if (type === "mediafire") return "🔵";
  if (type === "gdrive") return "🟢";
  return "⬇️";
};

const getLinkBadge = (type: string) => {
  if (type === "mega")
    return (
      <span className="text-[10px] bg-red-900/40 border border-red-600/60 text-red-400 px-2 py-0.5 rounded font-bold tracking-wide">
        ☁️ MEGA.NZ
      </span>
    );
  if (type === "youtube")
    return (
      <span className="text-[10px] bg-red-900/40 border border-red-600/60 text-red-400 px-2 py-0.5 rounded font-bold tracking-wide">
        ▶️ YOUTUBE
      </span>
    );
  if (type === "mediafire")
    return (
      <span className="text-[10px] bg-blue-900/40 border border-blue-600/60 text-blue-400 px-2 py-0.5 rounded font-bold tracking-wide">
        🔵 MEDIAFIRE
      </span>
    );
  if (type === "gdrive")
    return (
      <span className="text-[10px] bg-green-900/40 border border-green-600/60 text-green-400 px-2 py-0.5 rounded font-bold tracking-wide">
        🟢 GOOGLE DRIVE
      </span>
    );
  return (
    <span className="text-[10px] bg-gray-800 border border-gray-600 text-gray-400 px-2 py-0.5 rounded font-bold tracking-wide">
      ⬇️ DIRECT
    </span>
  );
};

const getButtonLabel = (type: string) => {
  if (type === "mega") return "Open on Mega.nz";
  if (type === "youtube") return "Open on YouTube";
  if (type === "mediafire") return "Download from MediaFire";
  if (type === "gdrive") return "Download from Google Drive";
  return "Download File";
};

const getButtonStyle = (type: string, clicked: boolean) => {
  if (clicked) return "bg-green-600 text-white shadow-lg shadow-green-900/40";
  if (type === "mega")
    return "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-900/40";
  if (type === "youtube")
    return "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-900/40";
  if (type === "mediafire")
    return "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white shadow-lg shadow-blue-900/40";
  if (type === "gdrive")
    return "bg-gradient-to-r from-emerald-700 to-emerald-500 hover:from-emerald-600 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/40";
  return "bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white shadow-lg shadow-green-900/40";
};

const DownloadPage: React.FC<DownloadPageProps> = ({ movie, onClose, onWatch }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);

  // Build combined download links list
  const allLinks: DownloadLink[] = [];

  if (movie.downloadLinks && movie.downloadLinks.length > 0) {
    movie.downloadLinks.forEach((dl) => {
      allLinks.push({
        ...dl,
        type: dl.type || getLinkType(dl.url),
      });
    });
  }

  // Add legacy single download link if no multi-links
  if (allLinks.length === 0 && movie.downloadUrl) {
    allLinks.push({
      url: movie.downloadUrl,
      label: movie.downloadLabel || "Download",
      size: "",
      type: getLinkType(movie.downloadUrl),
    });
  }

  const handleCopy = (url: string, idx: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Open the link directly in a new tab
  const handleOpenLink = (link: DownloadLink, idx: number) => {
    const url = getDirectUrl(link);
    window.open(url, "_blank", "noopener,noreferrer");
    setClickedIdx(idx);
    setTimeout(() => setClickedIdx(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl mx-auto my-0 min-h-screen flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Banner */}
        <div className="relative h-56 md:h-72 overflow-hidden flex-shrink-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors border border-white/20"
          >
            <X size={20} />
          </button>

          {/* Movie Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 flex gap-4 items-end">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-20 h-28 object-cover rounded-lg border-2 border-white/20 flex-shrink-0 hidden sm:block shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[#E50914] font-black text-sm">KELLYBOX</span>
                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                  {movie.type === "series" ? "📺 Series" : "🎬 Movie"}
                </span>
                {allLinks.length > 0 && (
                  <span className="text-xs bg-green-900/50 border border-green-700/50 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                    <Download size={10} />
                    {allLinks.length} {allLinks.length === 1 ? "Link" : "Links"}
                  </span>
                )}
              </div>
              <h1 className="text-white font-black text-2xl md:text-3xl leading-tight truncate">
                {movie.title}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-300 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {movie.year}
                </span>
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star size={11} fill="currentColor" /> {movie.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {movie.duration}
                </span>
                {movie.genre.slice(0, 3).map((g) => (
                  <span key={g} className="flex items-center gap-1">
                    <Tag size={10} /> {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-[#0d0d0d] px-4 md:px-6 py-6 space-y-6">

          {/* Watch Button */}
          <button
            onClick={onWatch}
            className="w-full flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#f40612] text-white font-bold py-3.5 rounded-xl transition-colors text-sm shadow-lg shadow-red-900/30"
          >
            <Play size={18} fill="white" /> Watch Now
          </button>

          {/* Description */}
          {movie.description && (
            <p className="text-gray-400 text-sm leading-relaxed">
              {movie.description}
            </p>
          )}

          {/* ─── DOWNLOAD SECTION ─── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Download size={18} className="text-green-400" />
              <h2 className="text-white font-bold text-lg">Download</h2>
              <span className="text-xs bg-green-900/30 border border-green-700/50 text-green-400 px-2 py-0.5 rounded">
                {allLinks.length} {allLinks.length === 1 ? "Link" : "Links"} Available
              </span>
            </div>

            {allLinks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-700 rounded-xl">
                <Download size={40} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500 text-sm">No download links available</p>
                <p className="text-gray-600 text-xs mt-1">Contact admin to add download links</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allLinks.map((link, idx) => {
                  const type = link.type || getLinkType(link.url);
                  const directUrl = getDirectUrl(link);
                  const qColor = qualityColor(link.label);
                  const isClicked = clickedIdx === idx;
                  const isCopied = copiedIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl overflow-hidden transition-all ${
                        isClicked
                          ? "border-green-500/60 bg-green-900/10"
                          : "border-gray-700/60 bg-[#1a1a1a] hover:border-gray-500 hover:bg-[#1f1f1f]"
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center gap-3 p-4">
                        {/* Quality Badge */}
                        <div className={`flex-shrink-0 border rounded-lg px-3 py-2 text-center min-w-[80px] ${qColor}`}>
                          <span className="text-xs font-bold">{link.label}</span>
                          {link.size && (
                            <p className="text-[10px] opacity-70 mt-0.5">{link.size}</p>
                          )}
                        </div>

                        {/* Link Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-semibold">
                              {getLinkIcon(type)} {link.label}
                            </span>
                            {getLinkBadge(type)}
                            {link.size && (
                              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <HardDrive size={9} /> {link.size}
                              </span>
                            )}
                          </div>
                           <p className="text-gray-500 text-xs mt-0.5 truncate">
                            {type === "mega"      && "→ Opens Mega.nz — click Download there"}
                            {type === "youtube"   && "→ Opens YouTube in new tab"}
                            {type === "mediafire" && "→ Opens MediaFire — click Download button"}
                            {type === "gdrive"    && "→ Downloads from Google Drive"}
                            {type === "direct"    && directUrl}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Copy URL */}
                          <button
                            onClick={() => handleCopy(directUrl, idx)}
                            title="Copy link"
                            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                          >
                            {isCopied ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          {/* ─── MAIN DOWNLOAD BUTTON — Opens directly ─── */}
                          <button
                            onClick={() => handleOpenLink(link, idx)}
                            className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-lg transition-all active:scale-95 ${getButtonStyle(type, isClicked)}`}
                          >
                            {isClicked ? (
                              <>
                                <CheckCircle size={14} /> Opening...
                              </>
                            ) : (
                              <>
                                {type === "mega" ? (
                                  <><Zap size={14} /> {getButtonLabel(type)}</>
                                ) : type === "youtube" ? (
                                  <><Play size={14} fill="white" /> {getButtonLabel(type)}</>
                                ) : type === "mediafire" ? (
                                  <><Download size={14} /> {getButtonLabel(type)}</>
                                ) : type === "gdrive" ? (
                                  <><Download size={14} /> {getButtonLabel(type)}</>
                                ) : (
                                  <><Download size={14} /> {getButtonLabel(type)}</>
                                )}
                                <ExternalLink size={11} className="opacity-70" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Tip shown after clicking */}
                      {isClicked && (
                        <div className="px-4 pb-4 pt-0">
                          <div className={`rounded-lg p-3 flex items-start gap-2 text-xs ${
                            type === "mega"      ? "bg-red-900/20 border border-red-800/40" :
                            type === "youtube"   ? "bg-red-900/20 border border-red-800/40" :
                            type === "mediafire" ? "bg-blue-900/20 border border-blue-800/40" :
                            type === "gdrive"    ? "bg-emerald-900/20 border border-emerald-800/40" :
                                                   "bg-green-900/20 border border-green-800/40"
                          }`}>
                            <CheckCircle size={13} className={`mt-0.5 flex-shrink-0 ${
                              type === "mega" || type === "youtube" ? "text-red-400" :
                              type === "mediafire" ? "text-blue-400" :
                              type === "gdrive" ? "text-emerald-400" :
                              "text-green-400"
                            }`} />
                            <span className="text-gray-300 leading-relaxed">
                              {type === "mega" && (
                                <>
                                  <strong className="text-white">Mega.nz is now open</strong> in a new tab.
                                  On the Mega page, click the <strong className="text-white">Download</strong> button.
                                  For large files, use the <strong className="text-white">MEGA Desktop App</strong> for faster speeds.
                                </>
                              )}
                              {type === "youtube" && (
                                <>
                                  <strong className="text-white">YouTube is now open</strong> in a new tab.
                                  To download, copy the URL and use{" "}
                                  <a href="https://y2mate.com" target="_blank" rel="noopener noreferrer"
                                    className="text-yellow-400 underline font-semibold" onClick={(e) => e.stopPropagation()}>
                                    y2mate.com
                                  </a>{" "}or{" "}
                                  <a href="https://9xbuddy.in" target="_blank" rel="noopener noreferrer"
                                    className="text-yellow-400 underline font-semibold" onClick={(e) => e.stopPropagation()}>
                                    9xbuddy.in
                                  </a>.
                                </>
                              )}
                              {type === "mediafire" && (
                                <>
                                  <strong className="text-blue-300">MediaFire is now open</strong> in a new tab.
                                  Click the large green <strong className="text-white">DOWNLOAD</strong> button on that page.
                                  No account required for most files. If ads appear, close them and click Download again.
                                </>
                              )}
                              {type === "gdrive" && (
                                <>
                                  <strong className="text-emerald-300">Google Drive is now open</strong> in a new tab.
                                  Click the <strong className="text-white">Download ⬇</strong> icon at the top right.
                                  You may need a Google account for large files.
                                </>
                              )}
                              {type === "direct" && (
                                <>
                                  <strong className="text-white">Download started!</strong>{" "}
                                  If it opened in browser instead,{" "}
                                  <strong className="text-white">right-click → Save As</strong>.
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <Shield size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">Safe Links</p>
                <p className="text-gray-500 text-xs mt-0.5">All links are verified and safe</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <Wifi size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">Fast Servers</p>
                <p className="text-gray-500 text-xs mt-0.5">High-speed download servers</p>
              </div>
            </div>
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <HardDrive size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-semibold">Multi Quality</p>
                <p className="text-gray-500 text-xs mt-0.5">Choose your preferred quality</p>
              </div>
            </div>
          </div>

          {/* How to Download */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <ChevronRight size={14} className="text-[#E50914]" /> How to Download
            </h3>
            <div className="space-y-3">
              {[
                { step: "1", title: "Choose Quality", desc: "Pick your preferred quality (4K, 1080p, 720p, etc.) from the links above", color: "#E50914" },
                { step: "2", title: "Click Download", desc: "Click the colored button — it opens the download source directly in a new tab", color: "#E50914" },
                { step: "3", title: "🔵 MediaFire", desc: "MediaFire opens → click the big green DOWNLOAD button → no account needed", color: "#3b82f6" },
                { step: "4", title: "☁️ Mega.nz", desc: "Mega.nz opens → click the Download button → use MEGA App for large files", color: "#ef4444" },
                { step: "5", title: "▶️ YouTube", desc: "YouTube opens → copy URL → paste on y2mate.com or 9xbuddy.in to download", color: "#ef4444" },
                { step: "6", title: "🟢 Google Drive", desc: "Google Drive opens → click ⬇ Download icon at top right", color: "#22c55e" },
                { step: "7", title: "⬇️ Direct Link", desc: "File downloads automatically to your device — check your Downloads folder", color: "#6b7280" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0 flex-shrink-0" style={{ background: item.color }}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">{item.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Warning Note */}
          <div className="flex items-start gap-3 bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4">
            <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-400/80 text-xs leading-relaxed">
              <strong className="text-yellow-400">Note:</strong>{" "}
              <strong className="text-blue-400">MediaFire</strong> — click the green Download button, close any ads if they appear.{" "}
              <strong className="text-red-400">Mega.nz</strong> — may need a free account for files over 5GB.{" "}
              <strong className="text-red-400">YouTube</strong> — use y2mate.com or 9xbuddy.in to download.{" "}
              <strong className="text-emerald-400">Google Drive</strong> — may need a Google account.{" "}
              Direct links download automatically to your device.
            </p>
          </div>

          {/* Footer */}
          <div className="text-center pb-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-1.5 mx-auto"
            >
              <Film size={14} /> Back to browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
