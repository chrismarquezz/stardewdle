import ReactDOM from "react-dom";
import { scrollbarStyles } from "../utils/scrollbarStyles";

export default function UpdatesModal({ isMuted, onClose, scaleFactor }) {
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
          className="justify-center align-middle relative z-10 flex flex-col overflow-y-auto p-4 md:pl-8 md:pr-8"
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
            What's New
          </h2>

          <div className={`space-y-2 md:space-y-4 text-[#BC6131] text-left text-md sm:text-2xl md:text-3xl leading-none overflow-y-auto max-h-[70vh] pr-2 ${scrollbarStyles}`}>
            <div>
              <p className="font-semibold">v1.3.1 — February 2026</p>
              <ul className="list-disc ml-6 md:ml-10">
                <li>
                  We decided to create a Discord server!
                </li>
                <li>
                  Join if you want share your guesses, talk about the game, or just want to say hi.
                </li>
                <li>
                  It's also the best spot to give feedback and any suggestions you may have.
                </li>
                <li>
                  If you'd like to join, check out the button in the home page!
                </li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold">v1.3.0 — December 2025</p>
              <ul className="list-disc ml-6 md:ml-10">
                <li>
                  Overhauled the hint system to provide useful hints
                </li>
                <li>
                  You can now choose which hints you would like to see
                </li>
                <li>
                  Make it as easy or as challenging as you like!
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">v1.2.0 — October 2025</p>
              <ul className="list-disc ml-6 md:ml-10">
                <li>
                  Implemented a "What's New" button to inform players of updates
                  and new features
                </li>
                <li>
                  Added a stat to Collections to track how many times a crop has
                  been the Daily Crop
                </li>
                <li>
                  Created a hint feature that filters out crops as the player
                  guesses
                </li>
                <li>New button styles on Game Page</li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">v1.1.0 — June 2025</p>
              <ul className="list-disc ml-6 md:ml-10">
                <li>
                  Added the Collections page, where you can refresh your memory on crop
                  information
                </li>
                <li>Designed a mobile-friendly interface</li>
                <li>
                  Now showing total guesses and correct guesses on share screen
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold">v1.0.0 — May 2025</p>
              <ul className="list-disc ml-6 md:ml-10">
                <li>Released the first version of Stardewdle</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2 md:space-y-4 text-[#BC6131] text-left text-md sm:text-2xl md:text-3xl leading-none mt-4 italic ">
            <p>
              Future updates will appear here as new changes are made!
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
