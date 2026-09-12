import { useNavigate } from "react-router-dom";
import { useSound } from "../context/SoundContext";
import { useState, useEffect } from "react";
import { useResponsiveScale } from "../hooks/useResponsiveScale";

import GameBox from "../components/game/GameBox";
import CustomButton from "../components/CustomButton";

export default function Game() {
  const { isMuted } = useSound();
  const navigate = useNavigate();
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  const designWidth = 1600;
  const designHeight = 900;
  const effectiveDesignWidth = isMobilePortrait ? designHeight : designWidth;
  const effectiveDesignHeight = isMobilePortrait ? designWidth : designHeight;
  const scaleFactor = useResponsiveScale(effectiveDesignWidth, effectiveDesignHeight);

  useEffect(() => {
    const handleResize = () => {
      const currentlyIsMobilePortrait =
        window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsMobilePortrait(currentlyIsMobilePortrait);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/background.webp')" }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />

      <div className={`absolute z-10 w-full h-full flex justify-center items-center pb-10`}>
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: isMobilePortrait ? `${designHeight}px` : `${designWidth}px`,
            height: isMobilePortrait ? `${designWidth}px` : `${designHeight}px`,
            transform: `scale(${scaleFactor})`,
            transformOrigin: "center center",
          }}
        >
          <CustomButton
            variant="title"
            icon="/images/stardewdleLogo.webp"
            label="Stardewdle Home"
            isMuted={isMuted}
            onClick={() => navigate("/")}
            className={isMobilePortrait ? "mr-[272px] mb-2" : ""}
            soundPath={"/sounds/mouseClick.mp3"}
          />

          <GameBox isMobilePortrait={isMobilePortrait} />
        </div>
      </div>
    </div>
  );
}