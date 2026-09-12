import { useState, useMemo } from "react";
import { useGameData } from "../../context/GameDataContext";
import { formatName } from "../../utils/formatString";
import { getSpriteStyle } from "../../utils/spriteUtils";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import { playSound } from "../../utils/playSound";

import CustomButton from "../CustomButton";

export default function QuotesGame({ gameState, updateGameState, isMobilePortrait, isMuted }) {
    const { quotes, dailyData } = useGameData();

    const targetVillagerIndex = dailyData?.dailyItems?.villager?.index;
    const targetVillager = quotes?.[targetVillagerIndex];
    const quoteIndices = dailyData?.dailyItems?.villager?.quotes || [];

    const [selectedVillager, setSelectedVillager] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [viewMode, setViewMode] = useState("grid");

    const unguessedVillagers = useMemo(
        () => quotes.filter(villager => !gameState.guesses.includes(villager.name)),
        [quotes, gameState.guesses]
    );

    if (!targetVillager) return null;

    const dailyQuotes = quoteIndices.map(qIdx => {
        const qObj = targetVillager.quotes.find(q => q.index === qIdx);
        return qObj ? qObj.quote : "???";
    });

    const maxGuesses = 6;
    const currentGuesses = gameState.guesses || [];

    const revealedCount = Math.min(currentGuesses.length + 1, maxGuesses);

    const handleSubmit = (isSkip = false) => {
        if (gameState.complete) return;
        if (!isSkip && !selectedVillager) return;

        const guessName = isSkip ? "Skipped" : selectedVillager.name;
        const isCorrect = !isSkip && guessName === targetVillager.name;
        const newGuesses = [...currentGuesses, guessName];

        const hasLost = newGuesses.length >= maxGuesses && !isCorrect;

        updateGameState({
            ...gameState,
            guesses: newGuesses,
            win: gameState.win || isCorrect,
            complete: gameState.complete || isCorrect || hasLost
        });

        setSelectedVillager(null);
        setShowPicker(false);

        if (!isMuted) {
            playSound(isCorrect ? "/sounds/reward.mp3" : "/sounds/sell.mp3");
        }
    };

    return (
        <div className={`flex items-center h-full md:gap-4 ${isMobilePortrait ? "flex-col w-full" : "flex-row"}`}>
            <div className={`flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}>
                <div className="relative bg-no-repeat bg-cover w-[360px] md:w-[240px] aspect-[60/41] bg-[url('/images/selected-frame.webp')]">
                    <div
                        style={{
                            backgroundImage: `url('/images/minigames/bundleIcons/helper.webp')`,
                            imageRendering: 'pixelated',
                        }}
                        className="absolute top-[24px] md:top-[16px] left-1/2 -translate-x-1/2 bg-cover h-[192px] md:h-[128px] aspect-square bg-no-repeat"
                    />
                </div>
                <div className="flex flex-col gap-1 justify-center items-center bg-no-repeat p-4 bg-[url('/images/game/guesses.webp')] bg-contain bg-center w-full h-[58%] aspect-[5/3]">
                    <h3 className="text-5xl text-main">Who said this?</h3>
                    <div className={`flex flex-col gap-2 overflow-y-auto max-h-[80%] w-[90%] items-center ${scrollbarStyles}`}>
                        {dailyQuotes.map((quoteText, idx) => {
                            const isRevealed = idx < revealedCount || gameState.complete;
                            if (idx >= revealedCount + 1 && !gameState.complete) return;
                            return (
                                <div key={idx} className={`text-main text-center px-1 bg-white ${isRevealed ? 'bg-opacity-30 w-full' : 'bg-opacity-15'}`}>
                                    {isRevealed ? (
                                        <p className="text-4xl md:text-2xl">{quoteText}</p>
                                    ) : (
                                        <p className="text-3xl md:text-xl italic">(Guess incorrectly to get another quote)</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            <div className={`flex flex-col justify-center items-center h-full p-4 relative ${isMobilePortrait ? "w-full" : "w-1/2"}`}
                style={{
                    backgroundImage: "url('/images/game/cropgrid-bg.webp')",
                    backgroundSize: "90% 90%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                <div className={`flex flex-wrap gap-2 items-center justify-center max-h-[40%] max-w-[75%] overflow-y-auto overflow-x-hidden ${scrollbarStyles} pb-8 mb-4`}>
                    {currentGuesses.map((guess, idx) => {
                        const isCorrect = guess === targetVillager.name;

                        const villagerArray = Array.isArray(quotes) ? quotes : quotes || [];

                        const guessedVillagerObj = villagerArray.find(item => item.name === guess);
                        const spriteIndex = guessedVillagerObj?.index ?? 0;
                        return (
                            <div
                                className="relative h-[120px] w-[120px] flex items-center justify-center"
                                style={{
                                    backgroundImage: "url('/images/minigames/boxMedium.webp')",
                                    backgroundSize: "100% 100%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                                key={idx}
                            >
                                <div
                                    className={`w-[100px] h-[100px] absolute z-0 opacity-90 mix-blend-multiply ${isCorrect ? "bg-cyan-500" : "bg-red-700"}`}
                                />
                                <div className="group w-[128px] h-[128px] flex items-center justify-center">
                                    <div
                                        style={getSpriteStyle("villagers", spriteIndex, 0, 128)}
                                        className="z-10 scale-[78%]"
                                    />
                                    <div
                                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-main text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap"
                                        style={{
                                            backgroundImage: "url('/images/label.webp')",
                                            backgroundSize: "100% 100%",
                                            backgroundRepeat: "no-repeat",
                                            height: "28px",
                                        }}
                                    >
                                        {formatName(guess)}
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
                <div
                    className="flex items-center justify-center bg-center bg-no-repeat bg-contain mb-4"
                    style={{
                        backgroundImage: "url('/images/name-banner.webp')",
                        width: "416px",
                        height: "76px",
                    }}
                >
                    <p className="text-5xl text-center text-main tracking-wide">
                        {gameState.complete
                            ? formatName(targetVillager.name)
                            : selectedVillager
                                ? formatName(selectedVillager.name)
                                : "Select a Villager..."
                        }
                    </p>
                </div>
                {gameState.complete ? (
                    <div className="text-5xl font-bold">
                        {gameState.win ? (
                            <span className="text-correct">Bundle Completed!</span>
                        ) : (
                            <span className="text-wrong">Out of guesses!</span>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => setShowPicker(!showPicker)}
                                className="group relative h-[120px] w-[120px] flex items-center justify-center clickable"
                                style={{
                                    backgroundImage: "url('/images/minigames/boxMedium.webp')",
                                    backgroundSize: "100% 100%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                {selectedVillager ?
                                    <div className="group w-[128px] h-[128px] flex items-center justify-center">
                                        <div
                                            style={getSpriteStyle("villagers", selectedVillager.index, 0, 128)}
                                            className="z-10 scale-[78%] clickable"
                                        />
                                    </div>
                                    : <img src="images/minigames/search.webp" className="scale-[4]" />

                                }
                                <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[12px]" />

                            </button>

                            <CustomButton
                                variant="submit"
                                label="Submit"
                                icon={"/images/submit-button.webp"}
                                onClick={handleSubmit}
                                isMuted={isMuted}
                                className={!selectedVillager ? "opacity-50 pointer-events-none" : ""}
                            >
                                <p className="text-main text-center text-3xl md:text-xl italic">Guesses left: {maxGuesses - currentGuesses.length}/{maxGuesses}</p>
                            </CustomButton>
                        </div>

                        {showPicker && (
                            <div className="absolute w-[90%] h-[90%] p-8 z-50 flex flex-col"
                                style={{
                                    backgroundImage: "url('/images/game/cropgrid-bg.webp')",
                                    backgroundSize: "100% 100%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                <div className="flex justify-between mb-2 pb-2 border-b-2 border-main">
                                    <CustomButton
                                        variant="share"
                                        icon="/images/minigames/arrowBack.webp"
                                        label="Close"
                                        isMuted={true}
                                        onClick={() => {
                                            setShowPicker(false);
                                        }}
                                        isMobilePortrait={isMobilePortrait}
                                    />
                                    <CustomButton
                                        variant="icon"
                                        icon={`/images/minigames/${viewMode === "grid" ? "list" : "grid"}Button.webp`}
                                        label={`Toggle ${viewMode === "grid" ? "List" : "Grid"} View`}
                                        isMuted={isMuted}
                                        onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")}
                                        showLabel={true}
                                        isMobilePortrait={isMobilePortrait}
                                    />
                                </div>

                                <div className={`overflow-y-auto overflow-x-hidden flex-1 p-2 ${scrollbarStyles}`}>
                                    <div className={`flex flex-wrap gap-2 justify-center items-center px-4`}>
                                        {unguessedVillagers.map(villager => (
                                            <button
                                                key={villager.name}
                                                onClick={() => {
                                                    setSelectedVillager(villager);
                                                    setShowPicker(false);
                                                }}
                                                style={{
                                                    backgroundImage: `url('/images/${viewMode === "grid" ? "game/tile-bg" : "minigames/wideTile"}.webp')`,
                                                    backgroundSize: "100% 100%",
                                                    backgroundPosition: "center",
                                                    backgroundRepeat: "no-repeat",
                                                }}
                                                className={`p-2 font-bold text-main clickable relative flex items-center justify-center
                                                ${viewMode === "grid" ? "w-24 h-24" : "w-[45%] h-24"}`}
                                            >
                                                {viewMode === "grid" ? (
                                                    <div className="relative group flex flex-col items-center">
                                                        <div
                                                            style={getSpriteStyle("villagers", villager.index, 0, 128)}
                                                            className="scale-[58%]"
                                                        />
                                                        <div
                                                            className="absolute top-1 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-xl font-medium text-main text-center transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap"
                                                            style={{
                                                                backgroundImage: "url('/images/label.webp')",
                                                                backgroundSize: "100% 100%",
                                                                backgroundRepeat: "no-repeat",
                                                                height: "28px",
                                                            }}
                                                        >
                                                            {formatName(villager.name)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-start items-center w-full h-full">
                                                        <div style={getSpriteStyle("villagers", villager.index, 0, 128)} className="scale-[58%] -ml-6" />
                                                        <div className="w-1/4 text-3xl md:text-xl font-medium text-main text-left leading-none z-10">{formatName(villager.name)}</div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
}