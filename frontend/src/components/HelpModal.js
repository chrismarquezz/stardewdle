import ReactDOM from "react-dom";
import { scrollbarStyles } from "../utils/scrollbarStyles";

export default function HelpModal({ isMuted, onClose, scaleFactor }) {
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
        <div
          className="justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8 "

          style={{
            backgroundImage: "url('/images/help-bg.webp')",
            backgroundSize: "100% 100%",
          }}
        >
          <button
            onClick={playCloseSound}
            className="clickable absolute top-0 left-3 md:left-6 text-[#BC6131] text-4xl md:text-7xl hover:text-red-500"
          >
            x
          </button>

          <h2 className="text-[#BC6131] text-center text-2xl md:text-5xl font-semibold mb-2">
            How to Play
          </h2>

          <div className={`space-y-2 md:space-y-4 text-[#BC6131] text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 mb-4 ${scrollbarStyles}`}>
            <p>- Select a crop from the grid</p>
            <p>- Click "Submit" to guess the crop of the day</p>
            <p>- You get 6 tries to guess correctly</p>

            <div>
              <p>- The result grid shows feedback:</p>
              <div className="flex flex-row items-center gap-4 md:gap-10 text-nowrap">
                <div className="ml-6 md:ml-10 mt-2 md:mt-4 space-y-3 md:space-y-5">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-4 h-4 md:w-8 md:h-8 bg-cyan-500 border md:border-2 border-cyan-600 rounded-sm mix-blend-multiply opacity-90" />
                    <span>Exact match</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-4 h-4 md:w-8 md:h-8 bg-amber-300 border md:border-2 border-amber-400 rounded-sm mix-blend-multiply opacity-90" />
                    <span>Partial match</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-4 h-4 md:w-8 md:h-8 bg-red-700 border md:border-2 border-red-800 rounded-sm mix-blend-multiply opacity-90" />
                    <span>Incorrect</span>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-5">
                  <div className="flex items-center gap-2 md:gap-4">
                    <img
                      src="/images/arrow4U.webp"
                      alt="Up Arrow"
                      className="w-4 h-2 md:w-8 md:h-4"
                    />
                    <span>The correct value is higher</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4">
                    <img
                      src="/images/arrow4D.webp"
                      alt="Down Arrow"
                      className="w-4 h-2 md:w-8 md:h-4"
                    />
                    <span>The correct value is lower</span>
                  </div>
                </div>
              </div>
            </div>
            <p>- Hover over the season image to see the season name</p>
            <p>
              - If you ever feel stuck, use the hint feature to narrow down your options
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
