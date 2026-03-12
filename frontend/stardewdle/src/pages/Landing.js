import { useNavigate } from "react-router-dom";
import { useSound } from "../context/SoundContext";
import { useState } from "react";
import { useResponsiveScale } from "../hooks/useResponsiveScale";

export default function Landing() {
  const { isMuted } = useSound();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const scaleFactor = useResponsiveScale(1080, 720);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background.webp')" }}
      />

      {/* Scaled Content */}
      <div className="relative z-10 w-full h-full flex justify-center items-center overflow-hidden">
        <div
          style={{
            width: "1080px",
            height: `${720 * scaleFactor}px`,
            transform: `scale(${scaleFactor})`,
            transformOrigin: "top center",
          }}
          className="flex flex-col items-center"
        >
          {/* Title near top */}
          <img
            src="/images/stardewdleTitle.webp"
            alt="Stardewdle Title"
            className="mt-10 max-w-[800px]"
          />

          {/* Button group */}
          <div className="flex flex-col items-center gap-4 mt-[140px]">
            {/* Play Button */}
            <div
              onClick={() => {
                if (!isMuted) {
                  new Audio("/sounds/menu-select.mp3").play();
                }
                navigate("/game");
              }}
              className="buttonMain w-[370px] h-[75px] clickable"
            >
              <img
                src="/images/play-button.webp"
                alt="Play"
                className="buttonBase"
              />
              <img
                src="/images/play-button-hover.webp"
                alt="Play Hover"
                className="buttonHover"
              />
            </div>

            {/* Collections Button */}
            <div
              onClick={() => {
                if (!isMuted) {
                  new Audio("/sounds/menu-select.mp3").play();
                }
                navigate("/collections");
              }}
              className="buttonMain w-[370px] h-[75px] clickable"
            >
              <img
                src="/images/collections-button.webp"
                alt="Collections"
                className="buttonBase"
              />
              <img
                src="/images/collections-button-hover.webp"
                alt="Collections Hover"
                className="buttonHover"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  if (!isMuted) {
                    new Audio("/sounds/mouseClick.mp3").play();
                  }
                  window.open(
                    "https://github.com/chrismarquezz/Stardewdle",
                    "_blank"
                  );
                }}
                className="buttonMain w-[75px] h-[75px] clickable"
              >
                <img
                  src="/images/github.webp"
                  alt="GitHub"
                  className="buttonBase"
                />
                <img
                  src="/images/github-hover.webp"
                  alt="GitHub Hover"
                  className="buttonHover"
                />
              </button>

<button
                onClick={() => {
                  if (!isMuted) {
                    new Audio("/sounds/mouseClick.mp3").play();
                  }
                  window.open(
                    "https://discord.gg/Fg56gpXXBK",
                    "_blank"
                  );
                }}
                className="buttonMain w-[75px] h-[75px] clickable"
              >
                <img
                  src="/images/discord.webp"
                  alt="Discord"
                  className="buttonBase"
                />
                <img
                  src="/images/discord-hover.webp"
                  alt="Discord Hover"
                  className="buttonHover"
                />
              </button>

              <button
                onClick={() => {
                  if (!isMuted) {
                    new Audio("/sounds/mouseClick.mp3").play();
                  }
                  setShowModal(true);
                }}
                className="buttonMain w-[75px] h-[75px] clickable"
              >
                <img
                  src="/images/credits.webp"
                  alt="Info"
                  className="buttonBase"
                />
                <img
                  src="/images/credits-hover.webp"
                  alt="Info Hover"
                  className="buttonHover"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
          onClick={() => {
            if (!isMuted) {
              new Audio("/sounds/mouseClick.mp3").play();
            }
            setShowModal(false);
          }}
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
              className="relative z-10 flex flex-col overflow-y-auto p-4"
              style={{
                backgroundImage: "url('/images/paper-note.webp')",
                backgroundSize: "100% 100%",
              }}
            >
              <button
                onClick={() => {
                  if (!isMuted) {
                    new Audio("/sounds/mouseClick.mp3").play();
                  }
                  setShowModal(false);
                }}
                className="clickable absolute top-[2%] left-[3%] text-gray-600 text-6xl hover:text-red-500"
              >
                x
              </button>

              <h2 className="text-gray-600 text-center text-4xl md:text-6xl font-semibold mb-2">
                Credits
              </h2>

              <div className="mt-6 space-y-10 text-gray-600 text-left text-3xl md:text-4xl leading-none overflow-y-auto">
                <p>- Built by Chris and Omar.</p>
                <p>- Artwork and sounds by ConcernedApe.</p>
                <p>- Inspired by Wordle and Stardew Valley.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
