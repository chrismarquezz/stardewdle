import { useState } from "react";
import { formatName } from "../utils/formatString";

export default function CropCard({ crop, isSelected, onClick, isMuted, guessable, isMobilePortrait }) {
  const formattedName = formatName(crop.name);
  const [isHovering, setIsHovering] = useState(false);

  async function handleEndHover() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsHovering(false);
  };

  const x_pos = parseInt(crop.crop_index) * 48;

  const spriteStyle = {
    backgroundImage: 'var(--sprite-url)',
    backgroundPosition: `-${x_pos}px 0px`,
    backgroundSize: '3456px 48px',
    width: '48px',
    height: '48px',
    imageRendering: 'pixelated',
  };

  return (
    <div
      onClick={() => {
        if (!guessable) return;
        if (!isMuted) {
          new Audio("/sounds/select.mp3").play();
        }
        onClick(crop);
      }}
      className={`relative w-16 h-16 p-1 flex items-center justify-center group ${guessable ? "clickable" : ""} ${isHovering ? "z-10" : "z-0"}`}
      style={{
        backgroundImage: "url('/images/tile-bg.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        scale: isMobilePortrait ? "1.1" : "1",
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => handleEndHover()}
    >

      <div
        className={`absolute w-full h-full opacity-50 mix-blend-multiply ${isSelected ? "bg-green-400" : ""}`}
      />

      <div
        style={spriteStyle}
        className="w-full h-full m-[2px] ml-[6px] mb-[6px] z-10"
        title={formattedName}
      />

      <div
        className={`absolute w-full h-full opacity-70 mix-blend-multiply ${guessable ? "" : "bg-gray-500"}`}
      />
      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-[#BC6131] text-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap"
        style={{
          backgroundImage: "url('/images/label.webp')",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          height: "28px",
        }}
      >
        {formattedName}
      </div>
    </div>
  );
}
