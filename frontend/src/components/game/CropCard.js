import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";
import CursorTooltip from "../CursorTooltip";
import { formatName } from "../../utils/formatString";
import { playSound } from "../../utils/playSound";
import { getCorrectGuessOverlayClass } from "../../utils/guessFeedbackStyles";

export default function CropCard({
  crop,
  isCorrectCrop,
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

  const disableColor = isCorrectCrop
    ? `${getCorrectGuessOverlayClass(theme)} opacity-60`
    : guessable
      ? ""
      : manuallyDisabled
        ? theme === "light"
          ? "mix-blend-multiply bg-gray-800 opacity-60"
          : "opacity-70 bg-slate-800 mix-blend-multiply"
        : theme === "light"
          ? "mix-blend-multiply bg-gray-400 opacity-60"
          : "opacity-40 bg-slate-800 mix-blend-multiply";

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
    ...(theme === "dark" ? { filter: "brightness(90%)" } : {}),
  };

  return (
    <CursorTooltip label={formattedName}>
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
          className={`absolute mix-blend-screen left-0 bottom-0 ${theme === "light" ? "opacity-60 top-0 right-0" : "opacity-30 top-1 right-1"} ${isSelected && !isCorrectCrop ? "bg-yellow-100" : ""}`}
        />

        <div
          style={spriteStyle}
          className={`w-full h-full m-[2px] ${theme === "light" ? "ml-[6px] mb-[6px]" : "ml-0 mb-0"} z-10`}
        />

        <div
          className={`absolute left-0 bottom-0 ${theme === "light" ? "top-0 right-0" : "top-[3px] right-[3px]"} ${disableColor}`}
        />
      </div>
    </CursorTooltip>
  );
}
