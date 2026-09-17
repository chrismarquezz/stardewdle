import ReactDOM from "react-dom";
import React, { useState } from "react";
import { playSound } from "../../utils/playSound";

export default function MinigamesShareModal({
  shareText,
  timeLeft,
  totalCompletions,
  onClose,
  isMuted,
  scaleFactor,
}) {
  const [copied, setCopied] = useState(false);

  const playCloseSound = () => {
    if (!isMuted) {
      playSound("/sounds/modal.mp3");
    }
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-20 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 z-0"
        onClick={playCloseSound}
      />

      <div
        className="relative max-w-[95vw] max-h-[95vh] w-full md:w-auto flex flex-col"
        style={{
          transform: `scale(${scaleFactor || 1})`,
          transformOrigin: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="justify-center align-middle relative z-10 overflow-y-auto p-8 py-4 md:py-8"
          style={{
            backgroundImage: "url('/images/help-bg.webp')",
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute left-4 md:left-6 top-1 text-main text-4xl md:text-6xl hover:text-red-500 z-20"
          >
            x
          </button>

          <div className="flex-1 flex flex-col justify-center min-w-0 md:min-w-[400px] h-full">
            <p className="text-main text-center text-2xl md:text-5xl font-bold md:mb-1">
              Next bundles in: {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
            </p>

            <p className="text-center text-main text-md md:text-3xl mb-2">
              {totalCompletions ?? 0} people have restored the Community Center today!
            </p>

            <p className="bg-[#FFD789] mx-auto bg-opacity-60 border-2 border-main p-4 text-main text-md md:text-xl whitespace-pre text-center flex-wrap overflow-y-auto w-full">
              {shareText}
            </p>

            <button
              onClick={handleCopy}
              className="mt-4 clickable w-[80%] mx-auto bg-main text-white text-2xl md:text-4xl py-2 hover:bg-[#9c4f26] transition"
            >
              {copied ? "Copied to Clipboard!" : "Share"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
