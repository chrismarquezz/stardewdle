import { useNavigate } from "react-router-dom";
import { useSound } from "../context/SoundContext";
import { useState, useEffect } from "react";
import { useResponsiveScale } from "../hooks/useResponsiveScale";

import CollectionsBox from "../components/collections/CollectionsBox";
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

      <div className={`absolute z-10 w-full h-full flex justify-center items-center ${isMobilePortrait ? "top-2" : "-top-4"}`}>
        <div
          className="flex flex-col items-center"
          style={{
            width: "1600px",
            height: isMobilePortrait ? "800px" : "900px",
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
              className={isMobilePortrait ? "top-[-470px]" : ""}
              soundPath={"/sounds/mouseClick.mp3"}
            />
          <div className="collections-mobile-wrapper">
            <CollectionsBox isMobilePortrait={isMobilePortrait} />
          </div>
        </div>
      </div>
    </div>
  );
}