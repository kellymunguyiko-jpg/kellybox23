import { useEffect, useState } from "react";

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

const messages = [
  "Loading...",
  "Please wait...",
  "Getting ready...",
  "Almost there...",
];

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, visible }) => {
  const [dots, setDots] = useState(".");
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 400);
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % messages.length);
    }, 1200);
    return () => {
      clearInterval(dotInterval);
      clearInterval(msgInterval);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 px-8 py-10 rounded-2xl bg-[#1a1a1a] border border-gray-800 shadow-2xl min-w-[240px]">
        {/* Logo */}
        <div className="text-[#E50914] font-black text-3xl tracking-widest animate-pulse select-none">
          KELLYBOX
        </div>

        {/* Spinner Ring */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
          {/* Spinning arc */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#E50914] border-r-[#E50914]/50 animate-spin" />
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-[#E50914]/10 animate-pulse" />
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#E50914]" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-white text-sm font-medium">
            {message || messages[msgIdx]}
            <span className="text-[#E50914] font-bold">{dots}</span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#E50914] to-[#ff6b6b] rounded-full animate-[loading-bar_1.5s_ease-in-out_infinite]" />
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
};

export default LoadingOverlay;
