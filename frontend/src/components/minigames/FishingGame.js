import { useState } from "react";
import { useGameData } from "../../context/GameDataContext";
import { formatName } from "../../utils/formatString";
import { getSpriteStyle } from "../../utils/spriteUtils";

import CustomButton from "../CustomButton";

export default function FishingGame({ gameState, updateGameState, isMobilePortrait, isMuted }) {
    const { fish, dailyData } = useGameData();

    const targetFishIndex = dailyData?.dailyItems?.fish;
    const targetFish = fish?.[targetFishIndex];

    const [selectedLetter, setSelectedLetter] = useState(null);

    if (!targetFish) return null;

    const targetName = targetFish.name.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
    const guessedLetters = gameState.guesses || [];

    const incorrectGuesses = guessedLetters.filter(char => !targetName.includes(char));
    const livesLost = incorrectGuesses.length;
    const maxLives = 5;
    const livesRemaining = maxLives - livesLost;

    const ROD_STYLES = [
        { color: 'bg-[#00ff00] h-[504px]', rod_pos: 'top-[20%]', fish_pos: 'top-[20%]' },
        { color: 'bg-[#deff00] h-[378px]', rod_pos: 'top-[33%]', fish_pos: 'top-[43%]' },
        { color: 'bg-[#ffbe00] h-[252px]', rod_pos: 'top-[48%]', fish_pos: 'top-[28%]' },
        { color: 'bg-[#ff7900] h-[126px]', rod_pos: 'top-[17%]', fish_pos: 'top-[57%]' },
        { color: 'bg-[#ff0300] h-[28px]', rod_pos: 'top-[22%]', fish_pos: 'top-[82%]' },
        { color: 'bg-black h-[0px]', rod_pos: 'bottom-[8%]', fish_pos: 'top-[0%] opacity-0' }
    ];

    const KEYBOARD = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    const handleSubmit = () => {
        if (!selectedLetter || gameState.complete || guessedLetters.includes(selectedLetter)) return;

        const newGuesses = [...guessedLetters, selectedLetter];
        const isCorrectGuess = targetName.includes(selectedLetter);

        const newLivesLost = isCorrectGuess ? livesLost : livesLost + 1;

        const uniqueLettersInName = new Set(targetName.replace(/\s/g, '').split(''));
        const hasWon = [...uniqueLettersInName].every(char => newGuesses.includes(char));
        const hasLost = newLivesLost >= maxLives;

        updateGameState({
            ...gameState,
            guesses: newGuesses,
            win: gameState.win || hasWon,
            complete: gameState.complete || hasWon || hasLost
        });

        setSelectedLetter(null);

        if (!isMuted) {
            new Audio(isCorrectGuess ? "/sounds/pluck.mp3" : "/sounds/sell.mp3").play();
            if (hasWon) new Audio("/sounds/reward.mp3").play();
            if (hasLost) new Audio("/sounds/lose.mp3").play();
        }
    };

    return (
        <div className={`flex flex-row justify-center items-center h-full gap-4`}>
            <div className="flex w-1/4 justify-center items-center">
                <div className="relative bg-no-repeat bg-contain w-[240px] aspect-[60/41] bg-[url('/images/selected-frame.webp')] justify-center items-center">
                    <div
                        style={{
                            backgroundImage: `url('/images/minigames/bundleIcons/qualityFish.webp')`,
                            imageRendering: 'pixelated',
                        }}
                        className="absolute top-[16px] left-1/2 -translate-x-1/2 bg-cover h-[128px] w-[128px] bg-no-repeat"
                    />
                </div>
                <div className="absolute bottom-10 flex w-40 h-40 items-center justify-center bg-[url('/images/minigames/fishCloud.webp')] bg-contain bg-center bg-no-repeat">
                    <div className="group mt-4 flex w-28 h-28 items-center justify-center bg-[url('/images/minigames/fishFrame.webp')] bg-contain bg-center bg-no-repeat">
                        {gameState.complete || gameState.hintUsed ? (
                            <div className="w-20 h-20 flex justify-center items-center overflow-hidden">
                                <div
                                    style={{
                                        ...getSpriteStyle("fish", targetFish.index, 0),
                                        filter: gameState.complete || gameState.win ? 'none' : 'brightness(0)'
                                    }}
                                    className="scale-100 transition-all duration-300"
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => updateGameState({ ...gameState, hintUsed: true })}
                                className="text-main text-3xl font-bold text-center w-full h-full clickable flex justify-center items-center"
                            >
                                <div className="absolute bg-white/50 mix-blend-overlay opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-auto w-28 h-28" />
                                Hint
                            </button>
                        )}
                    </div>
                </div>

            </div>
            <div className={`flex flex-col items-center justify-center h-[95%] w-[44%] gap-16 bg-[url('/images/game/cropgrid-bg.webp')] bg-no-repeat bg-contain bg-center `}>
                <div className="flex flex-row justify-center items-center w-full px-4 relative gap-4">
                    <div className="w-full px-6 flex flex-wrap justify-center items-center gap-x-8">
                        {targetName.split(' ').map((word, wordIndex) => (
                            <div key={wordIndex} className="flex gap-x-2">

                                {word.split('').map((char, charIndex) => {
                                    const isRevealed = guessedLetters.includes(char) || gameState.complete;
                                    const isMissed = gameState.complete && !gameState.win && !guessedLetters.includes(char);

                                    return (
                                        <div key={charIndex} className="flex items-center justify-center w-8 h-12 border-b-4 border-main">
                                            <span className={`text-5xl font-bold uppercase ${isMissed ? 'text-wrong' : 'text-main'}`}>
                                                {isRevealed ? char : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    {KEYBOARD.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex gap-2">
                            {row.map(key => {
                                const letter = key.toLowerCase();
                                const isGuessed = guessedLetters.includes(letter);
                                const isCorrect = isGuessed && targetName.includes(letter);
                                const isWrong = isGuessed && !targetName.includes(letter);
                                const isSelected = selectedLetter === letter;

                                return (
                                    <button
                                        key={key}
                                        disabled={gameState.complete || isGuessed}
                                        onClick={() => setSelectedLetter(letter)}
                                        className={`w-10 h-10 text-3xl font-bold clickable bg-[url('/images/game/tile-bg.webp')] bg-no-repeat bg-contain bg-center text-main`}
                                    >
                                        <div
                                            className={`absolute -translate-y-[2px] w-10 h-10 z-0 
                                                    ${isCorrect ? "bg-cyan-500 opacity-40 mix-blend-multiply"
                                                    : isWrong ? "bg-red-700 opacity-40 mix-blend-multiply"
                                                        : isSelected ? "bg-yellow-100 mix-blend-screen opacity-60"
                                                            : ""}`
                                            }
                                        />
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {!gameState.complete ? (
                    <CustomButton
                        variant="submit"
                        label="Submit"
                        icon={"/images/submit-button.webp"}
                        onClick={handleSubmit}
                        isMuted={true}
                        className={!selectedLetter ? "opacity-50 pointer-events-none" : ""}
                    >
                        <p className="text-main text-center text-xl italic">Guesses left: {livesRemaining}/{maxLives}</p>
                    </CustomButton>
                ) : (
                    <div className="text-4xl font-bold">
                        {gameState.win ? (
                            <span className="text-correct">Bundle Completed!</span>
                        ) : (
                            <span className="text-wrong">Out of guesses!</span>
                        )}
                    </div>
                )}
            </div>
            <div className='flex flex-col gap-4 h-full w-1/4 justify-center items-center '>
                <div className={`relative w-[133px] h-[525px] bg-[url('/images/minigames/fishingRod.webp')] bg-contain bg-no-repeat bg-center`}>
                    <img className={`absolute scale-[3.5] translate-x-1/2 -translate-y-1/2 right-[43%] ${ROD_STYLES[livesLost].rod_pos} transition-all duration-200`} src="/images/minigames/fishBar.webp" />
                    <img className={`absolute scale-[2] translate-x-1/2 -translate-y-1/2 right-[43%] ${ROD_STYLES[livesLost].fish_pos} transition-all duration-200`} src="/images/minigames/fishIcon.webp" />
                    <div className={`absolute w-[14px] bottom-[14px] right-[7px] ${ROD_STYLES[livesLost].color} transition-all duration-200`} src="/images/minigames/fishIcon.webp" />
                </div>
            </div>
        </div>
    );
}