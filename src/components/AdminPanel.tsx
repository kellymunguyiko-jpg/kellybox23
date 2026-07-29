import { useState, useRef, useEffect } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { db, db2, auth } from "../firebase";
import { Movie, DownloadLink } from "../types";
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Film,
  Link,
  Save,
  LogOut,
  Shield,
  Star,
  Eye,
  Upload,
  ImageIcon,
  CheckCircle,
  Loader2,
  Download,
  HardDrive,
  PlusCircle,
  Play,
} from "lucide-react";

interface AdminPanelProps {
  movies: Movie[];
  onClose: () => void;
  onLogout: () => void;
}

const CLOUDINARY_CLOUD_NAME = "dhgwgdmql";
const CLOUDINARY_UPLOAD_PRESET = "image_30p";

const GENRES = [
  "Action", "Adventure", "Animation", "Biography", "Comedy",
  "Crime", "Documentary", "Drama", "Fantasy", "Horror", "Romance", "Sci-Fi", "Thriller",
];

const emptyMovie: Omit<Movie, "id"> = {
  title: "",
  description: "",
  posterUrl: "",
  backdropUrl: "",
  thumbnailUrl: "",
  year: new Date().getFullYear(),
  rating: 7.0,
  duration: "2h 0m",
  genre: [],
  type: "movie",
  videoUrl: "",
  videoType: "youtube",
  downloadUrl: "",
  downloadLabel: "",
  downloadLinks: [],
  featured: false,
  createdAt: Date.now(),
};

const emptyDownloadLink: DownloadLink = {
  url: "",
  label: "",
  size: "",
  type: "mega",
};

// ─── Cloudinary Upload Hook ───────────────────────────────────────────────────
async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("cloud_name", CLOUDINARY_CLOUD_NAME);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Cloudinary upload failed");
  }

  const data = await res.json();
  return data.secure_url as string;
}

// ─── Google Drive URL converter ───────────────────────────────────────────────
function convertGoogleDriveUrl(url: string): string {
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (fileMatch) return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (openMatch) return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  return url;
}
function isGoogleDriveUrl(url: string): boolean { return url.includes("drive.google.com"); }

interface ImageUploadFieldProps {
  label: string; required?: boolean; value: string;
  onChange: (url: string) => void; previewClass?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label, required, value, onChange, previewClass = "h-24 w-16",
}) => {
  const [mode, setMode] = useState<"upload" | "gdrive" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gdriveInput, setGdriveInput] = useState("");
  const [gdriveError, setGdriveError] = useState("");
  const [gdriveApplied, setGdriveApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large — max 10MB"); return; }
    setUploading(true); setUploadError(""); setUploadSuccess(false); setProgress(0);
    // Simulate progress
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 85)), 200);
    try {
      const url = await uploadToCloudinary(file);
      clearInterval(interval); setProgress(100);
      onChange(url); setUploadSuccess(true);
      setTimeout(() => { setUploadSuccess(false); setProgress(0); }, 3000);
    } catch (err: unknown) {
      clearInterval(interval); setProgress(0);
      setUploadError("❌ " + (err instanceof Error ? err.message : "Upload failed"));
    } finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleGDriveApply = () => {
    setGdriveError(""); setGdriveApplied(false);
    if (!gdriveInput.trim()) { setGdriveError("Please paste a Google Drive link"); return; }
    if (!isGoogleDriveUrl(gdriveInput)) { setGdriveError("This doesn't look like a Google Drive link"); return; }
    const converted = convertGoogleDriveUrl(gdriveInput.trim());
    onChange(converted); setGdriveApplied(true);
    setTimeout(() => setGdriveApplied(false), 2500);
  };

  const TABS = [
    { id: "upload" as const, icon: "☁", label: "Cloudinary", color: "#E50914" },
    { id: "gdrive" as const, icon: "🟢", label: "Drive",     color: "#22c55e" },
    { id: "url"    as const, icon: "🔗", label: "URL",       color: "#60a5fa" },
  ];

  return (
    <div className="space-y-2">
      {/* Label + Tab Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex items-center gap-1 bg-[#111] rounded-lg p-0.5 border border-gray-800">
          {TABS.map(t => (
            <button
              key={t.id} type="button"
              onClick={() => setMode(t.id)}
              className="text-[10px] px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1"
              style={{
                background: mode === t.id ? t.color : "transparent",
                color: mode === t.id ? "white" : "#666",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cloudinary Upload ── */}
      {mode === "upload" && (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
          style={{
            border: dragOver ? "2px solid #E50914" : uploading ? "2px solid #333" : "2px dashed #333",
            background: dragOver ? "rgba(229,9,20,0.08)" : "#141414",
            transform: dragOver ? "scale(1.01)" : "none",
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

          {/* Content */}
          <div className="p-6 flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-2 border-gray-700 flex items-center justify-center">
                    <Loader2 size={24} className="text-[#E50914] animate-spin" />
                  </div>
                  <svg className="absolute inset-0 w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="26" fill="none" stroke="#E50914" strokeWidth="2"
                      strokeDasharray={`${progress * 1.634} 163.4`} strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-semibold">Uploading to Cloudinary CDN...</p>
                  <p className="text-gray-500 text-xs mt-0.5">{progress}% complete</p>
                </div>
                <div className="w-48 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#E50914] to-red-400 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : uploadSuccess ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-900/30 border-2 border-green-500/50 flex items-center justify-center">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <div className="text-center">
                  <p className="text-green-300 text-sm font-bold">Upload Successful! ✨</p>
                  <p className="text-gray-500 text-xs mt-0.5">Image is now on Cloudinary CDN</p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                  style={{ background: dragOver ? "rgba(229,9,20,0.2)" : "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)" }}
                >
                  {dragOver
                    ? <Upload size={26} className="text-[#E50914]" style={{ animation: "bounce 0.5s infinite alternate" }} />
                    : <ImageIcon size={24} className="text-[#E50914]" />
                  }
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-semibold">
                    {dragOver ? "Drop image here!" : "Click to browse or drag & drop"}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">JPG, PNG, WebP, GIF — Max 10MB</p>
                </div>
                <div className="flex items-center gap-2 bg-[#E50914]/10 border border-[#E50914]/20 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E50914] animate-pulse" />
                  <span className="text-[10px] text-[#E50914] font-bold tracking-wide">CLOUDINARY CDN</span>
                  <span className="text-[10px] text-gray-500">Auto-optimized</span>
                </div>
              </>
            )}
          </div>
          {uploadError && (
            <div className="px-4 pb-3 text-center">
              <p className="text-red-400 text-xs">{uploadError}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Google Drive ── */}
      {mode === "gdrive" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.2)", background: "#0d1f0d" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(34,197,94,0.08)", borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-sm">🟢</span>
            </div>
            <div>
              <p className="text-green-300 text-xs font-bold">Google Drive Upload</p>
              <p className="text-gray-500 text-[10px]">Paste any Google Drive share link</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 bg-green-900/30 border border-green-700/30 rounded-full px-2 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] text-green-400 font-bold">CONNECTED</span>
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Input */}
            <div className="relative">
              <input
                value={gdriveInput}
                onChange={e => { setGdriveInput(e.target.value); setGdriveError(""); }}
                onKeyDown={e => e.key === "Enter" && handleGDriveApply()}
                placeholder="https://drive.google.com/file/d/YOUR_FILE_ID/view"
                className="w-full rounded-xl px-4 py-3 text-xs text-white outline-none transition-all pr-24"
                style={{
                  background: "#081808",
                  border: gdriveError ? "1.5px solid #ef4444" : gdriveApplied ? "1.5px solid #22c55e" : "1.5px solid rgba(34,197,94,0.25)",
                }}
              />
              {gdriveInput && (
                <button type="button" onClick={() => setGdriveInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <X size={11} />
                </button>
              )}
            </div>

            {gdriveError && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {gdriveError}</p>}
            {gdriveApplied && <p className="text-green-400 text-xs flex items-center gap-1">✅ Google Drive link applied successfully!</p>}

            <button type="button" onClick={handleGDriveApply}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
              style={{ background: gdriveInput ? "linear-gradient(135deg, #16a34a, #22c55e)" : "#1a2a1a", color: gdriveInput ? "white" : "#555" }}>
              <CheckCircle size={13} /> Apply Drive Link
            </button>

            {/* How-to steps */}
            <div className="rounded-xl p-3" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">📋 How to get the link</p>
              <div className="space-y-1.5">
                {[
                  { step: "1", text: "Open your image in Google Drive" },
                  { step: "2", text: <>Right-click → <span className="text-gray-200">"Share"</span> or top-right Share button</> },
                  { step: "3", text: <><span className="text-green-400">"Anyone with the link"</span> → Viewer → Done</> },
                  { step: "4", text: <>Click <span className="text-gray-200">"Copy link"</span> and paste above</> },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-900/60 border border-green-700/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-400 text-[8px] font-black">{s.step}</span>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/5">
                <p className="text-yellow-600 text-[10px] flex items-start gap-1">
                  ⚠ <span>Make sure sharing is set to <span className="text-yellow-400 font-semibold">"Anyone with the link"</span> — otherwise the image won't display</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── URL ── */}
      {mode === "url" && (
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Link size={14} className="text-gray-500" />
            </div>
            <input
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder="https://example.com/movie-poster.jpg"
              className="w-full bg-[#141414] border border-gray-800 focus:border-blue-500 text-white rounded-xl px-4 py-3 text-sm outline-none transition-colors pl-9"
            />
          </div>
          <p className="text-gray-600 text-[10px]">💡 Paste any direct image URL (Imgur, TMDB, etc.)</p>
        </div>
      )}

      {/* ── Preview ── */}
      {value && (
        <div className="flex items-center gap-3 rounded-xl p-3 transition-all"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className={`${previewClass} rounded-lg overflow-hidden flex-shrink-0 border border-white/10`}>
            <img src={value} alt="preview" className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={11} className="text-green-400 flex-shrink-0" />
              <span className="text-green-400 text-xs font-bold">Image Ready</span>
              {isGoogleDriveUrl(value) && (
                <span className="text-[9px] bg-green-900/40 border border-green-700/40 text-green-400 px-1.5 py-0.5 rounded-full">🟢 Drive</span>
              )}
            </div>
            <p className="text-gray-600 text-[10px] truncate">{value.slice(0, 50)}...</p>
            <button type="button" onClick={() => { onChange(""); setGdriveInput(""); }}
              className="text-red-500 hover:text-red-400 text-[10px] mt-1.5 flex items-center gap-1 transition-colors">
              <X size={9} /> Remove image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Firestore Rules Constants ────────────────────────────────────────────────
const RULES_SERVER1 = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuth() {
      return request.auth != null;
    }

    // ✅ SERVER 1 RULES — Reads are public, Writes require login
    // Go to: console.firebase.google.com → kellybox-febfa → Firestore → Rules

    // Movies — public read, authenticated write
    match /movies/{movieId} {
      allow read: if true;
      allow create, update, delete: if isAuth();
    }

    // Series — public read, authenticated write
    match /series/{seriesId} {
      allow read: if true;
      allow create, update, delete: if isAuth();
      match /episodes/{episodeId} {
        allow read: if true;
        allow create, update, delete: if isAuth();
      }
    }

    // Featured / Trending — public read, auth write
    match /featured/{docId} {
      allow read: if true;
      allow write: if isAuth();
    }
    match /trending/{docId} {
      allow read: if true;
      allow write: if isAuth();
    }

    // Settings — public read, auth write
    match /settings/{docId} {
      allow read: if true;
      allow write: if isAuth();
    }

    // Users — own data only
    match /users/{userId} {
      allow read, write: if isAuth() && request.auth.uid == userId;
    }

    // Watchlist — own data only
    match /watchlist/{docId} {
      allow read, write: if isAuth();
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

const RULES_SERVER2 = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ✅ OPEN RULES FOR SERVER 2 — All reads public, all writes open
    // This allows KellyBox admin to save content to Server 2
    // You can tighten this later once auth cross-project is set up

    // Movies — fully open read/write
    match /movies/{movieId} {
      allow read: if true;
      allow create, update, delete: if true;
    }

    // Series — fully open read/write
    match /series/{seriesId} {
      allow read: if true;
      allow create, update, delete: if true;
      match /episodes/{episodeId} {
        allow read: if true;
        allow create, update, delete: if true;
      }
    }

    // Featured / Trending — fully open
    match /featured/{docId} {
      allow read, write: if true;
    }
    match /trending/{docId} {
      allow read, write: if true;
    }

    // Settings — fully open
    match /settings/{docId} {
      allow read, write: if true;
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

// ─── Admin Panel ───────────────────────────────────────────────────────────────
const AdminPanel: React.FC<AdminPanelProps> = ({ movies, onClose, onLogout }) => {
  const [form, setForm] = useState<Omit<Movie, "id">>(emptyMovie);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServer, setEditingServer] = useState<1 | 2 | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState<"list" | "add">("list");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedServer, setSelectedServer] = useState<1 | 2 | "both">(1);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  const resetForm = () => {
    setForm({ ...emptyMovie, createdAt: Date.now() });
    setDownloadLinks([]);
    setEditingId(null);
    setError("");
  };

  const addDownloadLink = () => {
    setDownloadLinks((prev) => [...prev, { ...emptyDownloadLink }]);
  };

  const updateDownloadLink = (idx: number, field: keyof DownloadLink, value: string) => {
    setDownloadLinks((prev) =>
      prev.map((dl, i) => (i === idx ? { ...dl, [field]: value } : dl))
    );
  };

  const removeDownloadLink = (idx: number) => {
    setDownloadLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const autoDetectType = (url: string): DownloadLink["type"] => {
    if (url.includes("mega.nz")) return "mega";
    if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
    if (url.includes("drive.google.com")) return "gdrive";
    if (url.includes("mediafire.com")) return "mediafire";
    return "direct";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("❌ You are not logged in. Please sign in again.");
      return;
    }

    if (!form.title.trim()) return setError("Title is required");
    if (!form.posterUrl.trim()) return setError("Poster image is required — upload or paste a URL");
    if (!form.videoUrl.trim()) return setError("Video URL is required");

    setLoading(true);
    try {
      const movieData = {
        title: form.title.trim(),
        description: form.description.trim(),
        posterUrl: form.posterUrl.trim(),
        backdropUrl: form.backdropUrl.trim(),
        thumbnailUrl: form.thumbnailUrl?.trim() || "",
        year: form.year,
        rating: form.rating,
        duration: form.duration.trim(),
        genre: form.genre,
        type: form.type,
        videoUrl: form.videoUrl.trim(),
        videoType: form.videoType,
        downloadUrl: form.downloadUrl?.trim() || "",
        downloadLabel: form.downloadLabel?.trim() || "",
        downloadLinks: downloadLinks.filter((dl) => dl.url.trim() !== "").map((dl) => ({
          url: dl.url.trim(),
          label: dl.label.trim() || "Download",
          size: dl.size?.trim() || "",
          type: dl.type || autoDetectType(dl.url),
        })),
        featured: form.featured,
        createdAt: Date.now(),
        server: selectedServer,
      };

      if (editingId) {
        // Edit on the correct server
        const targetDb = editingServer === 2 ? db2 : db;
        const realId = editingId.startsWith("s1_") ? editingId.slice(3) : editingId.startsWith("s2_") ? editingId.slice(3) : editingId;
        await updateDoc(doc(targetDb, "movies", realId), movieData);
        setSuccess("✅ Updated on Server " + (editingServer || 1) + " successfully!");
      } else {
        // Save to selected server(s)
        if (selectedServer === 1 || selectedServer === "both") {
          await addDoc(collection(db, "movies"), movieData);
        }
        if (selectedServer === 2 || selectedServer === "both") {
          await addDoc(collection(db2, "movies"), movieData);
        }
        if (selectedServer === "both") {
          setSuccess("✅ Movie added to Server 1 & Server 2 successfully!");
        } else {
          setSuccess(`✅ Movie added to Server ${selectedServer} successfully!`);
        }
      }
      resetForm();
      setTab("list");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save.";
      if (msg.includes("permission") || msg.includes("insufficient") || msg.includes("PERMISSION_DENIED")) {
        setError("❌ Firestore permission denied. Apply the rules shown below in your Firebase Console.");
        setShowRules(true);
      } else {
        setError("❌ " + msg);
      }
    }
    setLoading(false);
  };

  const handleEdit = (movie: Movie) => {
    // Detect server from id prefix
    const srv = movie.id?.startsWith("s2_") ? 2 : 1;
    setEditingServer(srv);
    setSelectedServer(srv);
    setForm({
      title: movie.title,
      description: movie.description,
      posterUrl: movie.posterUrl,
      backdropUrl: movie.backdropUrl,
      thumbnailUrl: movie.thumbnailUrl || "",
      year: movie.year,
      rating: movie.rating,
      duration: movie.duration,
      genre: movie.genre,
      type: movie.type,
      videoUrl: movie.videoUrl,
      videoType: movie.videoType,
      downloadUrl: movie.downloadUrl || "",
      downloadLabel: movie.downloadLabel || "",
      downloadLinks: movie.downloadLinks || [],
      featured: movie.featured || false,
      createdAt: movie.createdAt || Date.now(),
    });
    setDownloadLinks(movie.downloadLinks || []);
    setEditingId(movie.id || null);
    setTab("add");
  };

  const handleDelete = async (id: string) => {
    if (!currentUser) { setError("❌ Not authenticated."); return; }
    setLoading(true);
    try {
      const isServer2 = id.startsWith("s2_");
      const targetDb = isServer2 ? db2 : db;
      const realId = id.startsWith("s1_") || id.startsWith("s2_") ? id.slice(3) : id;
      await deleteDoc(doc(targetDb, "movies", realId));
      setSuccess(`✅ Deleted from Server ${isServer2 ? 2 : 1} successfully!`);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete";
      if (msg.includes("permission") || msg.includes("insufficient") || msg.includes("PERMISSION_DENIED")) {
        setError("❌ Firestore permission denied. Apply the rules shown below.");
        setShowRules(true);
      } else {
        setError("❌ " + msg);
      }
    }
    setLoading(false);
  };

  const toggleGenre = (genre: string) => {
    setForm((prev) => ({
      ...prev,
      genre: prev.genre.includes(genre)
        ? prev.genre.filter((g) => g !== genre)
        : [...prev.genre, genre],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Shield size={22} className="text-[#E50914]" />
          <span className="text-white font-bold text-xl">Admin Panel</span>
          <span className="text-xs bg-[#E50914] text-white px-2 py-0.5 rounded font-medium">
            KELLYBOX
          </span>
          <span className="text-xs bg-green-700/40 border border-green-600/50 text-green-400 px-2 py-0.5 rounded">
            🔐 Logged In
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowRules(!showRules); setError(showRules ? "" : "📋 Firebase Rules — paste these in your Firebase Console to fix permission errors."); }}
            className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40 border border-yellow-800/50 px-3 py-2 rounded-lg transition-colors text-sm"
            title="Show Firestore Rules"
          >
            <Shield size={16} /> Rules
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 px-3 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
          >
            <X size={16} /> Close
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-[#1f1f1f] px-6 py-3 flex gap-4 border-b border-gray-800 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 text-sm text-gray-300 flex-shrink-0">
          <Film size={16} className="text-[#E50914]" />
          <span>{movies.filter((m) => m.type === "movie").length} Movies</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300 flex-shrink-0">
          <Eye size={16} className="text-blue-400" />
          <span>{movies.filter((m) => m.type === "series").length} Series</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300 flex-shrink-0">
          <Star size={16} className="text-yellow-400" />
          <span>{movies.filter((m) => m.featured).length} Featured</span>
        </div>
        <div className="w-px h-5 bg-gray-700 flex-shrink-0 self-center" />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] text-red-400 font-medium">🔴 S1: {movies.filter((m) => !m.id?.startsWith("s2_")).length}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[11px] text-blue-400 font-medium">🔵 S2: {movies.filter((m) => m.id?.startsWith("s2_")).length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300 ml-auto flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-gray-400 text-xs">☁ Cloudinary CDN Active</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-6 bg-[#1a1a1a] flex-shrink-0">
        <button
          onClick={() => { setTab("list"); resetForm(); }}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "list"
              ? "border-[#E50914] text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          Content List ({movies.length})
        </button>
        <button
          onClick={() => setTab("add")}
          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === "add"
              ? "border-[#E50914] text-white"
              : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          {editingId ? "✏️ Edit Content" : "➕ Add Content"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-xl overflow-hidden" style={{border:"1px solid rgba(239,68,68,0.4)"}}>
            <div className="bg-red-900/30 px-4 py-3 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <span className="text-red-400 text-lg mt-0.5">⚠️</span>
                <p className="text-red-300 text-sm font-medium">{error}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {showRules && (
                  <button onClick={() => setShowRules(false)}
                    className="text-[10px] text-red-400 hover:text-red-300 underline">
                    Hide Rules
                  </button>
                )}
                <button onClick={() => { setError(""); setShowRules(false); }}
                  className="text-red-400 hover:text-red-300 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* ── Firestore Rules Panel ── */}
            {showRules && (
              <div className="bg-[#0a0a0a] p-4 space-y-4" style={{borderTop:"1px solid rgba(239,68,68,0.2)"}}>
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-yellow-400" />
                  <p className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Fix: Apply These Firestore Rules</p>
                </div>

                {/* Step by step */}
                <div className="space-y-2">
                  {[
                    "Go to Firebase Console → firestore.google.com",
                    "Select your project → Firestore Database",
                    "Click the \"Rules\" tab at the top",
                    "Replace ALL existing rules with the code below",
                    "Click \"Publish\" button",
                    "Repeat for your Second Firebase project too",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-400 text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <p className="text-gray-300 text-xs">{step}</p>
                    </div>
                  ))}
                </div>

                {/* Rules for Server 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-red-400 text-xs font-bold">🔴 Server 1 — kellybox-febfa</p>
                      <p className="text-gray-500 text-[10px]">Requires login to write • Email/Password auth</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(RULES_SERVER1);
                        setSuccess("✅ Server 1 rules copied!");
                        setTimeout(() => setSuccess(""), 3000);
                      }}
                      className="text-[10px] bg-red-900/40 hover:bg-red-900/60 text-red-300 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-red-800/40"
                    >
                      📋 Copy Server 1 Rules
                    </button>
                  </div>
                  <pre className="bg-[#0d0d0d] rounded-lg p-3 text-[10px] text-green-300 overflow-x-auto max-h-52 border border-red-900/30 leading-relaxed whitespace-pre-wrap">
{RULES_SERVER1}
                  </pre>
                </div>

                {/* Rules for Server 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="text-blue-400 text-xs font-bold">🔵 Server 2 — chatting-e7a27</p>
                      <p className="text-gray-500 text-[10px]">Open write access • No auth required for this server</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(RULES_SERVER2);
                        setSuccess("✅ Server 2 rules copied!");
                        setTimeout(() => setSuccess(""), 3000);
                      }}
                      className="text-[10px] bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-blue-800/40"
                    >
                      📋 Copy Server 2 Rules
                    </button>
                  </div>
                  <pre className="bg-[#0d0d0d] rounded-lg p-3 text-[10px] text-green-300 overflow-x-auto max-h-52 border border-blue-900/30 leading-relaxed whitespace-pre-wrap">
{RULES_SERVER2}
                  </pre>
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                    <p className="text-blue-300 text-[10px] font-bold mb-1">ℹ️ Server 2 uses open rules</p>
                    <p className="text-gray-400 text-[10px] leading-relaxed">
                      Server 2 (chatting-e7a27) uses open write rules so KellyBox can save content without cross-project authentication. Only the movies collection is open — everything else is blocked.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                  <p className="text-yellow-300 text-[10px] font-bold mb-1">⚡ How to apply:</p>
                  <p className="text-gray-400 text-[10px] leading-relaxed">
                    1. Go to <span className="text-white">console.firebase.google.com</span><br/>
                    2. Select the project → <span className="text-white">Firestore Database</span> → <span className="text-white">Rules</span> tab<br/>
                    3. Replace ALL existing text with the copied rules<br/>
                    4. Click <span className="text-white font-bold">Publish</span><br/>
                    5. Do this for <span className="text-red-400">both projects</span> separately
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* LIST TAB */}
        {tab === "list" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">All Content</h3>
              <button
                onClick={() => { resetForm(); setTab("add"); }}
                className="flex items-center gap-2 bg-[#E50914] hover:bg-[#f40612] text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={16} /> Add New
              </button>
            </div>

            {movies.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Film size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">No content yet</p>
                <p className="text-sm mt-1">Add your first movie or series</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {movies.map((movie) => (
                  <div
                    key={movie.id}
                    className="flex items-center gap-4 bg-[#1f1f1f] hover:bg-[#252525] border border-gray-800 rounded-xl p-3 transition-colors"
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/100x150/1a1a1a/666?text=?";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm truncate">
                          {movie.title}
                        </p>
                        {movie.featured && (
                          <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-1.5 py-0.5 rounded">
                            FEATURED
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            movie.type === "series"
                              ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                              : "bg-red-600/20 text-red-400 border border-red-500/40"
                          }`}
                        >
                          {movie.type.toUpperCase()}
                        </span>
                        {/* Server badge */}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                          movie.id?.startsWith("s2_")
                            ? "bg-blue-900/30 text-blue-400 border border-blue-700/40"
                            : "bg-red-900/30 text-red-400 border border-red-700/40"
                        }`}>
                          {movie.id?.startsWith("s2_") ? "🔵 S2" : "🔴 S1"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span>{movie.year}</span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Star size={10} fill="currentColor" /> {movie.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          {movie.videoType === "youtube"   ? <span className="text-[10px]">🎥</span> :
                           movie.videoType === "mega"      ? <span className="text-[10px]">☁️</span> :
                           movie.videoType === "mediafire" ? <span className="text-[10px]">🔵</span> :
                           movie.videoType === "gdrive"    ? <span className="text-[10px]">🟢</span> :
                                                             <Link size={10} className="text-purple-400" />}
                          <span className="uppercase text-[9px] font-bold">{movie.videoType}</span>
                        </span>
                        <span className="text-gray-500">{movie.genre.slice(0, 2).join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(movie)}
                        className="text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 p-2 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={16} />
                      </button>
                      {deleteConfirm === movie.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(movie.id!)}
                            className="text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/50 px-2 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-400 hover:text-white bg-gray-800 px-2 py-1.5 rounded text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(movie.id!)}
                          className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT TAB */}
        {tab === "add" && (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
            <div className="bg-[#1f1f1f] border border-gray-800 rounded-xl p-6 space-y-5">
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                <Film size={18} className="text-[#E50914]" />
                {editingId ? "Edit Content" : "Add New Content"}
              </h3>

              {/* Type */}
              <div className="flex gap-3">
                {(["movie", "series"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                      form.type === t
                        ? "bg-[#E50914] border-[#E50914] text-white"
                        : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {t === "movie" ? "🎬 Movie" : "📺 Series"}
                  </button>
                ))}
              </div>

              {/* ─── Server Selector ─── */}
              {!editingId && (
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(99,102,241,0.4)", background: "linear-gradient(135deg, #0f0f1a 0%, #0a0a14 100%)" }}>
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(99,102,241,0.12)", borderBottom: "1px solid rgba(99,102,241,0.25)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                      <Shield size={14} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-indigo-300 text-xs font-bold tracking-wider uppercase">Upload Server</p>
                      <p className="text-gray-500 text-[10px]">Choose which Firebase server to save this content</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-indigo-900/30 border border-indigo-700/40 rounded-full px-2.5 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-[9px] text-indigo-300 font-bold">REQUIRED</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Server Cards */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Server 1 */}
                      <button
                        type="button"
                        onClick={() => setSelectedServer(1)}
                        className="relative rounded-xl p-3 text-left transition-all duration-200 overflow-hidden"
                        style={{
                          border: selectedServer === 1 ? "2px solid #E50914" : "2px solid rgba(255,255,255,0.06)",
                          background: selectedServer === 1 ? "rgba(229,9,20,0.12)" : "rgba(255,255,255,0.02)",
                          transform: selectedServer === 1 ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        {selectedServer === 1 && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#E50914] flex items-center justify-center">
                            <CheckCircle size={10} className="text-white" />
                          </div>
                        )}
                        <div className="text-lg mb-1">🔴</div>
                        <p className="text-white text-[11px] font-bold">Server 1</p>
                        <p className="text-gray-500 text-[9px] mt-0.5">kellybox-febfa</p>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-[9px] text-green-400">PRIMARY</span>
                        </div>
                      </button>

                      {/* Server 2 */}
                      <button
                        type="button"
                        onClick={() => setSelectedServer(2)}
                        className="relative rounded-xl p-3 text-left transition-all duration-200 overflow-hidden"
                        style={{
                          border: selectedServer === 2 ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,0.06)",
                          background: selectedServer === 2 ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.02)",
                          transform: selectedServer === 2 ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        {selectedServer === 2 && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                            <CheckCircle size={10} className="text-white" />
                          </div>
                        )}
                        <div className="text-lg mb-1">🔵</div>
                        <p className="text-white text-[11px] font-bold">Server 2</p>
                        <p className="text-gray-500 text-[9px] mt-0.5">chatting-e7a27</p>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                          <span className="text-[9px] text-blue-400">BACKUP</span>
                        </div>
                      </button>

                      {/* Both */}
                      <button
                        type="button"
                        onClick={() => setSelectedServer("both")}
                        className="relative rounded-xl p-3 text-left transition-all duration-200 overflow-hidden"
                        style={{
                          border: selectedServer === "both" ? "2px solid #22c55e" : "2px solid rgba(255,255,255,0.06)",
                          background: selectedServer === "both" ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)",
                          transform: selectedServer === "both" ? "scale(1.02)" : "scale(1)",
                        }}
                      >
                        {selectedServer === "both" && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle size={10} className="text-white" />
                          </div>
                        )}
                        <div className="text-lg mb-1">🟢</div>
                        <p className="text-white text-[11px] font-bold">Both</p>
                        <p className="text-gray-500 text-[9px] mt-0.5">All servers</p>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                          <span className="text-[9px] text-yellow-400">REDUNDANT</span>
                        </div>
                      </button>
                    </div>

                    {/* Info bar */}
                    <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{
                      background: selectedServer === 1 ? "rgba(229,9,20,0.08)" : selectedServer === 2 ? "rgba(59,130,246,0.08)" : "rgba(34,197,94,0.08)",
                      border: selectedServer === 1 ? "1px solid rgba(229,9,20,0.2)" : selectedServer === 2 ? "1px solid rgba(59,130,246,0.2)" : "1px solid rgba(34,197,94,0.2)",
                    }}>
                      <span className="text-base">{selectedServer === 1 ? "🔴" : selectedServer === 2 ? "🔵" : "🟢"}</span>
                      <div>
                        <p className="text-white text-[11px] font-semibold">
                          {selectedServer === 1 && "Saving to Server 1 (kellybox-febfa)"}
                          {selectedServer === 2 && "Saving to Server 2 (chatting-e7a27)"}
                          {selectedServer === "both" && "Saving to both Server 1 & Server 2"}
                        </p>
                        <p className="text-gray-500 text-[10px]">
                          {selectedServer === "both"
                            ? "Content will be duplicated across both Firebase projects for maximum availability"
                            : `Content will be saved to the ${selectedServer === 1 ? "primary" : "backup"} Firebase project`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show current server when editing */}
              {editingId && (
                <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Shield size={16} className="text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-indigo-300 text-xs font-bold">Editing on {editingServer === 2 ? "Server 2 (chatting-e7a27)" : "Server 1 (kellybox-febfa)"}</p>
                    <p className="text-gray-500 text-[10px]">Changes will be saved to the same server this content was uploaded to</p>
                  </div>
                  <span className="ml-auto text-lg">{editingServer === 2 ? "🔵" : "🔴"}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Rampage"
                  className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-[#E50914] text-white rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Plot summary..."
                  rows={3}
                  className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-[#E50914] text-white rounded-lg px-4 py-2.5 text-sm outline-none resize-none transition-colors"
                />
              </div>

              {/* ─── Poster Image (Cloudinary Upload) ─── */}
              <ImageUploadField
                label="Poster Image"
                required
                value={form.posterUrl}
                onChange={(url) => setForm((p) => ({ ...p, posterUrl: url }))}
                previewClass="h-28 w-20"
              />

              {/* ─── Backdrop Image (Cloudinary Upload) ─── */}
              <ImageUploadField
                label="Backdrop / Banner Image"
                value={form.backdropUrl}
                onChange={(url) => setForm((p) => ({ ...p, backdropUrl: url }))}
                previewClass="h-20 w-36"
              />

              {/* Video Source */}
              <div>
                <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                  Video Source <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {([
                    { value: "youtube",   icon: "🎥", label: "YouTube",      color: "border-red-600/70 bg-red-900/20",    activeGlow: "shadow-red-900/50" },
                    { value: "mega",      icon: "☁️", label: "Mega.nz",      color: "border-orange-600/70 bg-orange-900/20", activeGlow: "shadow-orange-900/50" },
                    { value: "mediafire", icon: "🔵", label: "MediaFire",    color: "border-blue-600/70 bg-blue-900/20",  activeGlow: "shadow-blue-900/50" },
                    { value: "gdrive",    icon: "🟢", label: "Google Drive", color: "border-green-600/70 bg-green-900/20", activeGlow: "shadow-green-900/50" },
                    { value: "other",     icon: "🔗", label: "Direct URL",   color: "border-purple-600/70 bg-purple-900/20", activeGlow: "shadow-purple-900/50" },
                  ] as const).map((vt) => (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, videoType: vt.value as "youtube" | "mega" | "mediafire" | "gdrive" | "other" }))}
                      className={`py-3 text-xs rounded-xl font-bold transition-all border flex flex-col items-center justify-center gap-1.5 ${
                        form.videoType === vt.value
                          ? `${vt.color} text-white scale-[1.03] shadow-lg ${vt.activeGlow}`
                          : "bg-[#1a1a1a] border-gray-700/50 text-gray-500 hover:border-gray-500 hover:text-gray-300 hover:bg-[#222]"
                      }`}
                    >
                      <span className="text-lg">{vt.icon}</span>
                      <span className="text-[10px] tracking-wide">{vt.label}</span>
                    </button>
                  ))}
                </div>

                {/* URL Input with dynamic styling */}
                <div className={`relative rounded-xl overflow-hidden transition-all ${
                  form.videoType === "youtube"   ? "ring-1 ring-red-700/40" :
                  form.videoType === "mega"      ? "ring-1 ring-orange-700/40" :
                  form.videoType === "mediafire" ? "ring-1 ring-blue-700/40" :
                  form.videoType === "gdrive"    ? "ring-1 ring-green-700/40" :
                                                   "ring-1 ring-purple-700/40"
                }`}>
                  {/* Source icon prefix */}
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">
                    {form.videoType === "youtube"   ? "🎥" :
                     form.videoType === "mega"      ? "☁️" :
                     form.videoType === "mediafire" ? "🔵" :
                     form.videoType === "gdrive"    ? "🟢" : "🔗"}
                  </div>
                  <input
                    value={form.videoUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Auto-detect type from URL
                      if (val.includes("youtube.com") || val.includes("youtu.be")) {
                        setForm((p) => ({ ...p, videoType: "youtube", videoUrl: val }));
                      } else if (val.includes("mega.nz")) {
                        setForm((p) => ({ ...p, videoType: "mega", videoUrl: val }));
                      } else if (val.includes("mediafire.com")) {
                        setForm((p) => ({ ...p, videoType: "mediafire", videoUrl: val }));
                      } else if (val.includes("drive.google.com")) {
                        setForm((p) => ({ ...p, videoType: "gdrive", videoUrl: convertGoogleDriveUrl(val) }));
                      } else {
                        setForm((p) => ({ ...p, videoUrl: val }));
                      }
                    }}
                    placeholder={
                      form.videoType === "youtube"   ? "https://www.youtube.com/watch?v=... or https://youtu.be/..." :
                      form.videoType === "mega"      ? "https://mega.nz/file/... or https://mega.nz/embed/..." :
                      form.videoType === "mediafire" ? "https://www.mediafire.com/file/XXXXXX/filename.mp4/file" :
                      form.videoType === "gdrive"    ? "https://drive.google.com/file/d/FILE_ID/view" :
                                                       "https://example.com/movie.mp4 or .mkv"
                    }
                    className="w-full bg-[#1e1e1e] border-0 text-white rounded-xl pl-10 pr-4 py-3 text-sm outline-none transition-colors placeholder-gray-600"
                  />
                </div>

                {/* Status / Info bar */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {form.videoType === "youtube" && (
                    <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-1.5">
                      <span className="text-[10px]">🎥</span>
                      <span className="text-red-400 text-[10px] font-medium">YouTube embed — streams directly in player</span>
                    </div>
                  )}
                  {form.videoType === "mega" && (
                    <div className="flex items-center gap-1.5 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-1.5">
                      <span className="text-[10px]">☁️</span>
                      <span className="text-orange-400 text-[10px] font-medium">Mega.nz embed — streams via Mega player</span>
                    </div>
                  )}
                  {form.videoType === "mediafire" && (
                    <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-1.5">
                      <span className="text-[10px]">🔵</span>
                      <span className="text-blue-400 text-[10px] font-medium">MediaFire — user clicks to open MediaFire page</span>
                    </div>
                  )}
                  {form.videoType === "gdrive" && (
                    <div className="flex items-center gap-1.5 bg-green-900/20 border border-green-700/30 rounded-lg px-3 py-1.5">
                      <span className="text-[10px]">🟢</span>
                      <span className="text-green-400 text-[10px] font-medium">Google Drive embed — streams in player</span>
                    </div>
                  )}
                  {form.videoType === "other" && (
                    <div className="flex items-center gap-1.5 bg-purple-900/20 border border-purple-700/30 rounded-lg px-3 py-1.5">
                      <span className="text-[10px]">🔗</span>
                      <span className="text-purple-400 text-[10px] font-medium">Direct URL — native video player used</span>
                    </div>
                  )}

                  {/* Auto-detect badge */}
                  {form.videoUrl && (
                    <div className="flex items-center gap-1 bg-gray-800/60 border border-gray-700/40 rounded-lg px-2 py-1">
                      <span className="text-[9px] text-gray-500">AUTO:</span>
                      <span className="text-[9px] text-gray-300 font-bold uppercase">{form.videoType}</span>
                    </div>
                  )}
                </div>

                {/* MediaFire how-to box */}
                {form.videoType === "mediafire" && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(59,130,246,0.25)", background: "linear-gradient(135deg, #0d1220, #0a0f1a)" }}>
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(59,130,246,0.1)", borderBottom: "1px solid rgba(59,130,246,0.15)" }}>
                      <span className="text-sm">🔵</span>
                      <span className="text-blue-300 text-xs font-bold">How to get MediaFire link</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        { step: "1", text: "Upload your video to mediafire.com" },
                        { step: "2", text: "Right-click your file → Share → Copy Link" },
                        { step: "3", text: "Paste the link here (e.g. mediafire.com/file/XXX/movie.mp4/file)" },
                        { step: "4", text: "Users will be redirected to MediaFire to watch/download" },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                          <span className="text-gray-400 text-[10px] leading-relaxed">{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Drive how-to box */}
                {form.videoType === "gdrive" && (
                  <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.25)", background: "linear-gradient(135deg, #0a1a0d, #071209)" }}>
                    <div className="flex items-center gap-2 px-3 py-2" style={{ background: "rgba(34,197,94,0.1)", borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
                      <span className="text-sm">🟢</span>
                      <span className="text-green-300 text-xs font-bold">How to get Google Drive embed link</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {[
                        { step: "1", text: "Upload video to Google Drive" },
                        { step: "2", text: "Right-click → Share → Anyone with the link → Viewer" },
                        { step: "3", text: 'Click "Copy link" and paste here' },
                        { step: "4", text: "Link auto-converts to embed format ✅" },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-green-600 text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.step}</div>
                          <span className="text-gray-400 text-[10px] leading-relaxed">{s.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Video Thumbnail (shown before play) ─── */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.3)", background: "linear-gradient(135deg, #1a1025 0%, #0f0a1a 100%)" }}>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3" style={{ background: "rgba(139,92,246,0.1)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}>
                    <Film size={16} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-purple-300 text-xs font-bold tracking-wide">VIDEO THUMBNAIL</p>
                    <p className="text-gray-500 text-[10px]">Image shown over video before user clicks play</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-purple-900/30 border border-purple-700/40 rounded-full px-2.5 py-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="text-[9px] text-purple-300 font-bold">OPTIONAL</span>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Live preview of how it looks on the player */}
                  {form.thumbnailUrl && (
                    <div className="rounded-xl overflow-hidden relative" style={{ aspectRatio: "16/9", background: "#000" }}>
                      <img
                        src={form.thumbnailUrl}
                        alt="Video thumbnail preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      {/* Overlay — mimics the video player look */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)" }}>
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl" style={{ background: "rgba(229,9,20,0.9)", border: "3px solid rgba(255,255,255,0.3)" }}>
                          <Play size={24} className="text-white ml-1" fill="white" />
                        </div>
                        <p className="text-white text-xs font-bold mt-2 drop-shadow">{form.title || "Movie Title"}</p>
                        <p className="text-gray-300 text-[10px] mt-0.5 drop-shadow">{form.duration} • {form.year}</p>
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, thumbnailUrl: "" }))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-black/90 flex items-center justify-center text-white transition-colors"
                      >
                        <X size={12} />
                      </button>
                      <div className="absolute top-2 left-2 bg-purple-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PREVIEW
                      </div>
                    </div>
                  )}

                  {/* Upload field */}
                  <ImageUploadField
                    label="Thumbnail Image"
                    value={form.thumbnailUrl || ""}
                    onChange={(url) => setForm(p => ({ ...p, thumbnailUrl: url }))}
                    previewClass="h-0 w-0 hidden"
                  />

                  {/* Tips */}
                  <div className="rounded-lg p-3 space-y-1.5" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">💡 Tips</p>
                    {[
                      { icon: "📐", text: "Best size: 1280×720px (16:9 ratio)" },
                      { icon: "🖼️", text: "Use the backdrop/banner image if no custom thumbnail" },
                      { icon: "✨", text: "High contrast images work best as thumbnails" },
                      { icon: "🎬", text: "This image hides when the user clicks Play" },
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-[11px]">{tip.icon}</span>
                        <p className="text-gray-500 text-[10px] leading-relaxed">{tip.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── Download Links (Multi-Quality) ─── */}
              <div className="bg-[#1a1a1a] border border-green-900/40 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download size={15} className="text-green-400" />
                    <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
                      Download Links
                    </label>
                    <span className="text-gray-500 text-xs font-normal">(optional — add multiple qualities)</span>
                  </div>
                  <button
                    type="button"
                    onClick={addDownloadLink}
                    className="flex items-center gap-1.5 bg-green-800/40 hover:bg-green-700/50 border border-green-700/60 text-green-400 hover:text-green-300 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <PlusCircle size={13} /> Add Link
                  </button>
                </div>

                {downloadLinks.length === 0 ? (
                  <div
                    onClick={addDownloadLink}
                    className="border-2 border-dashed border-green-900/40 rounded-xl p-6 text-center cursor-pointer hover:border-green-700/60 hover:bg-green-900/5 transition-all"
                  >
                    <Download size={24} className="mx-auto mb-2 text-green-800" />
                    <p className="text-gray-500 text-sm">Click to add a download link</p>
                    <p className="text-gray-600 text-xs mt-1">Supports Mega.nz, YouTube, direct .mp4/.mkv</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {downloadLinks.map((dl, idx) => (
                      <div key={idx} className="bg-[#222] border border-gray-700 rounded-xl p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs font-medium">Link #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeDownloadLink(idx)}
                            className="text-red-500 hover:text-red-400 p-1 rounded transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* URL */}
                        <div>
                          <label className="block text-gray-500 text-xs mb-1">URL <span className="text-red-400">*</span></label>
                          <input
                            value={dl.url}
                            onChange={(e) => {
                              updateDownloadLink(idx, "url", e.target.value);
                              const detected = autoDetectType(e.target.value);
                              updateDownloadLink(idx, "type", detected);
                            }}
                            placeholder="https://mega.nz/file/... or https://youtu.be/... or https://mediafire.com/file/... or direct .mp4"
                            className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-green-500 text-white rounded-lg px-3 py-2 text-xs outline-none transition-colors"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {/* Label */}
                          <div>
                            <label className="block text-gray-500 text-xs mb-1">Quality Label</label>
                            <input
                              value={dl.label}
                              onChange={(e) => updateDownloadLink(idx, "label", e.target.value)}
                              placeholder="1080p HD"
                              className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-green-500 text-white rounded-lg px-3 py-2 text-xs outline-none transition-colors"
                            />
                          </div>

                          {/* Size */}
                          <div>
                            <label className="block text-gray-500 text-xs mb-1 flex items-center gap-1">
                              <HardDrive size={9} /> File Size
                            </label>
                            <input
                              value={dl.size || ""}
                              onChange={(e) => updateDownloadLink(idx, "size", e.target.value)}
                              placeholder="2.1 GB"
                              className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-green-500 text-white rounded-lg px-3 py-2 text-xs outline-none transition-colors"
                            />
                          </div>

                          {/* Type */}
                          <div>
                            <label className="block text-gray-500 text-xs mb-1">Type</label>
                            <select
                              value={dl.type}
                              onChange={(e) => updateDownloadLink(idx, "type", e.target.value as DownloadLink["type"])}
                              className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-green-500 text-white rounded-lg px-2 py-2 text-xs outline-none transition-colors"
                            >
                              <option value="mega">☁️ Mega.nz</option>
                              <option value="youtube">▶️ YouTube</option>
                              <option value="gdrive">🟢 Google Drive</option>
                              <option value="mediafire">🔵 MediaFire</option>
                              <option value="direct">⬇️ Direct</option>
                            </select>
                          </div>
                        </div>

                        {/* Auto-detected badge */}
                        {dl.url && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500">Auto-detected:</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                              dl.type === "mega"      ? "bg-red-900/30 text-red-400 border-red-700/50" :
                              dl.type === "youtube"   ? "bg-red-900/30 text-red-400 border-red-700/50" :
                              dl.type === "gdrive"    ? "bg-green-900/30 text-green-400 border-green-700/50" :
                              dl.type === "mediafire" ? "bg-blue-900/30 text-blue-400 border-blue-700/50" :
                                                       "bg-gray-800 text-gray-400 border-gray-700"
                            }`}>
                              {dl.type === "mega"      ? "☁️ MEGA.NZ" :
                               dl.type === "youtube"   ? "▶️ YOUTUBE" :
                               dl.type === "gdrive"    ? "🟢 GOOGLE DRIVE" :
                               dl.type === "mediafire" ? "🔵 MEDIAFIRE" :
                                                        "⬇️ DIRECT"}
                            </span>
                            {dl.type === "mediafire" && (
                              <span className="text-[10px] text-blue-400/70 italic">→ Opens MediaFire download page</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addDownloadLink}
                      className="w-full border border-dashed border-green-800/50 hover:border-green-600/70 text-green-600 hover:text-green-400 text-xs py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <PlusCircle size={13} /> Add Another Quality
                    </button>
                  </div>
                )}

                <p className="text-gray-600 text-xs">
                  💡 Supported: Mega.nz, YouTube, Google Drive, MediaFire, and direct .mp4/.mkv links. Add multiple qualities so users can choose.
                </p>
              </div>

              {/* Year, Rating, Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                    Year
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, year: parseInt(e.target.value) || 2024 }))
                    }
                    min="1900"
                    max="2099"
                    className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-[#E50914] text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                    Rating (0-10)
                  </label>
                  <input
                    type="number"
                    value={form.rating}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, rating: parseFloat(e.target.value) || 0 }))
                    }
                    min="0"
                    max="10"
                    step="0.1"
                    className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-[#E50914] text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1.5 font-medium uppercase tracking-wide">
                    Duration
                  </label>
                  <input
                    value={form.duration}
                    onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                    placeholder="2h 30m"
                    className="w-full bg-[#2a2a2a] border border-gray-700 focus:border-[#E50914] text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="block text-gray-400 text-xs mb-2 font-medium uppercase tracking-wide">
                  Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors border ${
                        form.genre.includes(g)
                          ? "bg-[#E50914] border-[#E50914] text-white"
                          : "bg-transparent border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, featured: !p.featured }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.featured ? "bg-[#E50914]" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      form.featured ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-gray-300 text-sm">
                  Featured (show in hero banner)
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { resetForm(); setTab("list"); }}
                className="flex-1 py-3 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-[#E50914] hover:bg-[#f40612] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-colors"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Save size={16} />
                    {editingId ? "Update" : "Add Content"}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
