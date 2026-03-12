import ReactDOM from "react-dom";
import { scrollbarStyles } from "../../utils/scrollbarStyles";

export default function CollectionsModal({ isMuted, onClose, scaleFactor }) {
  const playCloseSound = () => {
    if (!isMuted) {
      new Audio("/sounds/modal.mp3").play();
    }
    onClose();
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
      onClick={playCloseSound}
    >
      <div
        className="relative max-w-[95vw] max-h-[95vh] flex flex-col"
        style={{
          transform: `scale(${scaleFactor})`,
          transformOrigin: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Content */}
        <div
          className="justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8"
          style={{
            backgroundImage: "url('/images/help-bg.webp')",
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute top-0 text-[#BC6131] text-4xl md:text-6xl hover:text-red-500"
          >
            x
          </button>

          <h2 className="text-[#BC6131] text-center text-2xl md:text-5xl font-semibold mb-2">
            Collections Page
          </h2>

          <div className={`space-y-2 md:space-y-4 text-[#BC6131] text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 mb-4 ${scrollbarStyles}`}>
            <p>- Browse through all the crops from Stardew Valley</p>
            <p>- Click on any crop to view information such as:</p>
            <ul className="list-disc ml-6 md:ml-10">
              <li>Crop type</li>
              <li>Base selling price</li>
              <li>Growth time</li>
              <li>Regrow status</li>
              <li>Seasons of growth</li>
            </ul>
            <p>
              - You can also see how often a crop has been the daily crop
            </p>
            <p>
              - Use this page to prepare for your next guess
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
