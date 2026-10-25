import { useNavigate } from "react-router-dom";
import { useSound } from "../context/SoundContext";
import { useResponsiveLayout } from "../hooks/useResponsiveScale";

import CustomButton from "../components/CustomButton";
import MinigamesBox from "../components/minigames/MinigamesBox";

export default function Minigames() {
  const { isMuted } = useSound();
  const navigate = useNavigate();
  const { isMobilePortrait, width, height, scaleFactor } = useResponsiveLayout();

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
            width: `${width}px`,
            height: `${height}px`,
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
            className={isMobilePortrait ? "mr-[196px] mb-2" : ""}
            soundPath={"/sounds/mouseClick.mp3"}
          />
          <MinigamesBox isMobilePortrait={isMobilePortrait} />
        </div>
      </div>
    </div>
  );
}
