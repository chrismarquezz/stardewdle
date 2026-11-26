import ReactDOM from "react-dom";
import { useTheme } from "../context/ThemeContext";
import { useThemedAsset } from "../hooks/useThemedAsset";
import { playSound } from "../utils/playSound";

export default function CustomModal({
  title,
  isMuted,
  onClose,
  scaleFactor = 1,
  maxHeightClass = "max-h-[50vh] md:max-h-[70vh]",
  headerContent,
  children,
}) {
  const { theme } = useTheme();
  const backgroundImage = useThemedAsset("/images/help-bg.webp", theme);

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
        className={`relative max-w-[95vw] md:max-w-[70vw] lg:max-w-[50vw] ${maxHeightClass} flex flex-col`}
        style={{
          transform: `scale(${scaleFactor})`,
          transformOrigin: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8 ${theme === "dark" ? "[&_.text-main]:text-alternative-dark" : ""}`}
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute top-0 left-3 md:left-6 text-alternative-dark text-4xl md:text-7xl hover:text-wrong"
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
