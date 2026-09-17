import { useState, useEffect } from "react";
import { playSound } from "../../utils/playSound";

export default function GiftIcon({
  onClick,
  isMuted,
  soundPath = "/sounds/modal.mp3",
  label = "Share",
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!onClick) return;
    if (!isMuted) playSound(soundPath);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`group relative w-[72px] h-[76px] ${onClick ? "clickable transition-transform duration-200 hover:scale-105 active:scale-95 hover:brightness-110" : ""}`}
      style={{
        backgroundImage: "url(/images/minigames/gifts.webp)",
        backgroundPosition: `${index * 72}px`,
        backgroundSize: `288px 76px`,
        imageRendering: "pixelated",
      }}
    />
  );
}
