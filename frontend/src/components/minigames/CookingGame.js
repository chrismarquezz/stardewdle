import { useState, useMemo } from "react";
import { GameDataProvider, useGameData } from "../../context/GameDataContext";
import { formatName } from "../../utils/formatString";
import { scrollbarStyles } from "../../utils/scrollbarStyles";
import { getSpriteStyle } from "../../utils/spriteUtils";
import { playSound } from "../../utils/playSound";

import CustomButton from "../CustomButton";

export default function CookingGame({ gameState, updateGameState, isMobilePortrait, isMuted }) {
    const { cooking, dailyData } = useGameData();

    const targetFoodIndex = dailyData?.dailyItems?.cooking;
    const targetFood = cooking?.foods?.[targetFoodIndex];

    const [selectedFood, setSelectedFood] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [viewMode, setViewMode] = useState("grid");

    const unguessedFoods = useMemo(
        () => cooking?.foods?.filter(food => !gameState.guesses.includes(food.name)) ?? [],
        [cooking, gameState.guesses]
    );

    const masterIngredientList = useMemo(() => {
        if (!cooking) return [];

        const foodsArray = Array.isArray(cooking) ? cooking : cooking.foods || [];

        const uniqueIngredients = new Set();
        foodsArray.forEach(food => {
            if (food.ingredients) {
                Object.keys(food.ingredients).forEach(ingName => uniqueIngredients.add(ingName));
            }
        });

        return Array.from(uniqueIngredients).sort((a, b) => a.localeCompare(b));
    }, [cooking]);

    const handleSubmit = () => {
        if (!selectedFood || gameState.complete) return;

        const isCorrect = selectedFood.name === targetFood.name;
        const newGuesses = [...gameState.guesses, selectedFood.name];

        updateGameState({
            ...gameState,
            guesses: newGuesses,
            win: gameState.win || isCorrect,
            complete: gameState.complete || isCorrect || newGuesses.length >= 15
        });

        setSelectedFood(null);
        setShowPicker(false);
        if (!isMuted) playSound(isCorrect ? "/sounds/reward.mp3" : "/sounds/sell.mp3");
    };

    return (
        <div className={`flex items-center h-full gap-4 ${isMobilePortrait ? "flex-col w-full" : "flex-row"}`}>
            <div className={`flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}>
                <div className="relative bg-no-repeat bg-cover w-[240px] aspect-[60/41] bg-[url('/images/selected-frame.webp')]">
                    <div
                        style={{
                            backgroundImage: `url('/images/minigames/bundleIcons/homeCook.webp')`,
                            imageRendering: 'pixelated',
                        }}
                        className="absolute top-[16px] left-1/2 -translate-x-1/2 bg-cover h-[128px] w-[128px] bg-no-repeat"
                    />
                </div>
                <div className="flex flex-col justify-center items-center bg-[url('/images/game/guesses.webp')] bg-no-repeat p-4 bg-contain bg-center aspect-[5/3]">
                    <h3 className="text-5xl text-main pb-4">Ingredients Needed:</h3>

                    <div className="flex gap-8 pb-8 px-4">
                        {Object.entries(targetFood.ingredients).map(([ingName, count]) => {
                            const ingredientIndex = masterIngredientList.indexOf(ingName);

                            return (
                                <div key={ingName} className="relative flex flex-col justify-center items-center p-2">
                                    <div
                                        className={`w-18 h-18 p-1 flex items-center justify-center`}
                                        style={{
                                            backgroundImage: "url('/images/minigames/minigameCard.webp')",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            scale: isMobilePortrait ? "1.1" : "1",
                                        }}
                                    >
                                        <div
                                            style={getSpriteStyle("cooking", ingredientIndex, 0)}
                                            className="w-full h-full m-2 z-10"
                                        />
                                    </div>

                                    <div
                                        className="absolute -bottom-6 px-3 py-1 flex items-center justify-center text-xl font-medium text-main text-center whitespace-nowrap"
                                    >
                                        {count}x {formatName(ingName)}
                                    </div>
                                </div>

                            )
                        })}
                    </div>
                </div>
            </div>
            <div className={`flex flex-col justify-center items-center h-full p-4 relative gap-4 ${isMobilePortrait ? "w-full" : "w-1/2"}`}
                style={{
                    backgroundImage: "url('/images/game/cropgrid-bg.webp')",
                    backgroundSize: "90% 90%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}>
                <div className={`flex flex-wrap gap-2 items-center justify-center max-h-[50%] max-w-[80%] overflow-y-auto overflow-x-hidden ${scrollbarStyles} pb-8 px-10`}>
                    {gameState.guesses.map((guess, idx) => {
                        const isCorrect = guess === targetFood.name;

                        const foodsArray = Array.isArray(cooking) ? cooking : cooking?.foods || [];

                        const guessedFoodObj = foodsArray.find(item => item.name === guess);
                        const spriteIndex = guessedFoodObj?.index ?? 0;
                        return (
                            <div
                                className="relative h-[72px] w-[72px] flex items-center justify-center"
                                style={{
                                    backgroundImage: "url('/images/game/boxSquare.webp')",
                                    backgroundSize: "100% 100%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                                key={idx}
                            >
                                <div
                                    className={`w-[75%] h-[75%] absolute z-0 opacity-90 mix-blend-multiply ${isCorrect ? "bg-cyan-500" : "bg-red-700"}`}
                                />
                                <div className="group w-[63px] h-[63px] flex items-center justify-center">
                                    <div
                                        style={getSpriteStyle("cooking", spriteIndex, 1)}
                                        className="z-10 scale-[87.5%]"
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
                    className="flex items-center justify-center bg-center bg-no-repeat bg-contain"
                    style={{
                        backgroundImage: "url('/images/name-banner.webp')",
                        width: "416px",
                        height: "76px",
                    }}
                >
                    <p className="text-5xl text-center text-main tracking-wide">
                        {gameState.complete
                            ? formatName(targetFood.name)
                            : selectedFood
                                ? formatName(selectedFood.name)
                                : "Select a Food..."
                        }
                    </p>
                </div>

                {gameState.complete ? (
                    <div className="text-3xl font-bold">
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
                                className="group relative h-[72px] w-[72px] flex items-center justify-center clickable"
                                style={{
                                    backgroundImage: "url('/images/game/boxSquare.webp')",
                                    backgroundSize: "100% 100%",
                                    backgroundPosition: "center",
                                    backgroundRepeat: "no-repeat",
                                }}
                            >
                                {selectedFood ?
                                    <div
                                        style={getSpriteStyle("cooking", selectedFood.index, 1)}
                                        className="z-10 scale-[87.5%] clickable"
                                        title={formatName(selectedFood.name)}
                                    />
                                    : <img src="images/minigames/search.webp" className="scale-[2.5]" />
                                }
                                <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-[12px]" />

                            </button>

                            <CustomButton
                                variant="submit"
                                label="Submit"
                                icon={"/images/submit-button.webp"}
                                onClick={handleSubmit}
                                isMuted={isMuted}
                                className={!selectedFood ? "opacity-50 pointer-events-none" : ""}
                            >
                                    <p className="text-main text-center text-xl italic">Guesses left: {15 - gameState.guesses.length}/15</p>
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
                                        isMuted={isMuted}
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
                                        {unguessedFoods.map(food => (
                                            <button
                                                key={food.name}
                                                onClick={() => {
                                                    setSelectedFood(food);
                                                    setShowPicker(false);
                                                }}
                                                style={{
                                                    backgroundImage: `url('/images/${viewMode === "grid" ? "game/tile-bg" : "minigames/wideTile"}.webp')`,
                                                    backgroundSize: "100% 100%",
                                                    backgroundPosition: "center",
                                                    backgroundRepeat: "no-repeat",
                                                }}
                                                className={`p-2 font-bold text-main clickable relative
                                                ${viewMode === "grid" ? "" : "w-[45%]"}`}
                                            >
                                                {selectedFood?.name === food.name &&
                                                    <div className={`absolute top-0 left-0 w-full h-full opacity-60 mix-blend-screen bg-yellow-100`} />
                                                }
                                                {viewMode === "grid" ? (
                                                    <div className="relative group flex flex-col items-center">
                                                        <div
                                                            style={getSpriteStyle("cooking", food.index, 1)}
                                                            className="scale-[87.5%]"
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
                                                            {formatName(food.name)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-start items-center gap-3 w-full">
                                                        <div style={getSpriteStyle("cooking", food.index, 1)} className="scale-[87.5%]" />
                                                        <div className="w-3/5 text-xl font-medium text-main text-left leading-none z-10">{formatName(food.name)}</div>
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
        </div>
    );
}