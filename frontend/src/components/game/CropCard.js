import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import { formatName } from "../../utils/formatString";
import { playSound } from "../../utils/playSound";

export default function CropCard({
  crop,
  isSelected,
  onClick,
  isMuted,
  guessable,
  manuallyDisabled,
  interactable,
  playClickSound = true,
  isMobilePortrait,
}) {
  const { theme } = useTheme();
  const formattedName = formatName(crop.name);
  const [isHovering, setIsHovering] = useState(false);
  const canInteract = interactable ?? guessable;

  const disableColor = guessable ? "" 
  : manuallyDisabled 
      ? theme === "light" ? "mix-blend-multiply bg-gray-800 opacity-60 " : "opacity-70 bg-slate-800 mix-blend-multiply" 
      : theme === "light" ? "mix-blend-multiply bg-gray-400 opacity-60 " : "opacity-40 bg-slate-800 mix-blend-multiply" 

  async function handleEndHover() {
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsHovering(false);
  }

  const x_pos = parseInt(crop.crop_index) * 48;

  const spriteStyle = {
    backgroundImage: "var(--sprite-url)",
    backgroundPosition: `-${x_pos}px 0px`,
    backgroundSize: "3456px 48px",
    width: "48px",
    height: "48px",
    imageRendering: "pixelated",
  };

  return (
    <div
      onClick={() => {
        if (!canInteract) return;
        if (!isMuted && playClickSound) {
          playSound("/sounds/select.mp3");
        }
        onClick(crop);
      }}
      className={`relative w-16 h-16 flex items-center justify-center group ${canInteract ? "clickable" : ""} ${isHovering ? "z-10" : "z-0"}`}
      style={{
        backgroundImage: `url(${useThemedAsset("/images/game/tile-bg.webp", theme)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        scale: isMobilePortrait ? "1.1" : "1",
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => handleEndHover()}
    >
      <div
        className={`absolute opacity-60 mix-blend-screen left-0 bottom-0 ${theme === "light" ? "top-0 right-0" : "top-1 right-1"} ${isSelected ? "bg-yellow-100" : ""}`}
      />

      <div
        style={spriteStyle}
        className={`w-full h-full m-[2px] ${theme === "light" ? "ml-[6px] mb-[6px]" : "ml-0 mb-0"} z-10`}
      />

      <div
        className={`absolute left-0 bottom-0 ${theme === "light" ? "top-0 right-0" : "top-1 right-1"} ${disableColor}`}
      />

      <div
        className="absolute -top-5 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-main text-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap"
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
