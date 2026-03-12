import { useNavigate } from "react-router-dom";
import { useSound } from "../context/SoundContext";
import { useState, useEffect } from "react";

export default function Count() {
    const { isMuted } = useSound();
    const navigate = useNavigate();
    const [totalPlays, setTotalPlays] = useState(0);

    useEffect(() => {    
        const updateTotalPlays = async () => {
          try {
            const res = await fetch(process.env.REACT_APP_API_URL + "/word");
            const data = await res.json();
            setTotalPlays(data.global_total_plays+data.total_guesses || 0);
          } catch (err) {
            console.error("Failed to fetch total plays", err);
          }
        };
    
        updateTotalPlays();
    
      }, []);

    return (
        <div className="relative min-h-screen w-full overflow-y-auto flex justify-center">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat "
                style={{ backgroundImage: "url('/images/count/ocean.webp')"}}
            />

            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backdropFilter: "blur(1px)",
                    WebkitBackdropFilter: "blur(1px)",
                }}
            />
            
            {/* Scaled Content */}
            <div
                onClick={() => {
                    if (!isMuted) {
                        new Audio("/sounds/mouseClick.mp3").play();
                    }
                    navigate("/");
                }}
                className="buttonMain w-[624px] h-[114px] clickable"
            >
                <img
                    src="/images/stardewdleLogo.webp"
                    alt="Stardewdle Home"
                    className="buttonBase"
                />
                <img
                    src="/images/stardewdleLogo.webp"
                    alt="Stardewdle Home Hover"
                    className="buttonHover"
                />
            </div>

            {/* Display */}
            <div className="absolute bottom-0 w-full text-center flex flex-col justify-center items-center gap-5" >
                <div className="relative text-4xl font-bold text-[#615E56] bg-contain bg-center bg-no-repeat w-[300px] flex items-center justify-center text-center p-10 pt-8"
                    style={{ backgroundImage: "url('/images/count/speech.webp')" }}
                >
                    Stardewdle has been played a total of <br /> {totalPlays} times.
                </div>
                <img
                    src="/images/count/qi.webp"
                    alt="Mr Qi"
                    className="w-[424px] object-contain"
                />
            </div>
            
        </div>
    );
}
