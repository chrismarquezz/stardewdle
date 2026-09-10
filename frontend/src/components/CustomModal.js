import ReactDOM from "react-dom";
import { playSound } from "../utils/playSound";

// Shared overlay/frame/close-button chrome used by HelpModal, HintsModal, UpdatesModal, CollectionsModal.
export default function CustomModal({
  title,
  isMuted,
  onClose,
  scaleFactor,
  maxHeightClass = "max-h-[50vh]",
  headerContent,
  children,
}) {
  const playCloseSound = () => {
    if (!isMuted) {
      playSound("/sounds/modal.mp3");
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
      onClick={playCloseSound}
    >
      <div
        className={`relative max-w-[95vw] ${maxHeightClass} flex flex-col`}
        style={{
          transform: `scale(${scaleFactor})`,
          transformOrigin: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8"
          style={{
            backgroundImage: "url('/images/help-bg.webp')",
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute top-0 left-3 md:left-6 text-main text-4xl md:text-7xl hover:text-red-500"
          >
            x
          </button>

          {headerContent}

          {title && (
            <h2 className="text-main text-center text-2xl md:text-5xl font-semibold mb-2">
              {title}
            </h2>
          )}

          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
