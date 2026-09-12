import { createContext, useContext, useState, useEffect } from "react";

const GameDataContext = createContext();
const MOST_RECENT_UPDATE = "2026-11-9T00:00:00Z";

export const GameDataProvider = ({ children }) => {
    const [crops, setCrops] = useState([]);
    const [cooking, setCooking] = useState([]);
    const [minerals, setMinerals] = useState([]);
    const [fish, setFish] = useState([]);
    const [quotes, setQuotes] = useState([]);

    const [dailyData, setDailyData] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const [showUpdates, setShowUpdates] = useState(false);
    const [shouldPulse, setShouldPulse] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem("stardewdle-lastUpdateSeen");

        if (!lastSeen) {
            setShouldPulse(true);
        } else {
            const lastSeenDate = new Date(lastSeen);
            const mostRecentDate = new Date(MOST_RECENT_UPDATE);

            if (lastSeenDate < mostRecentDate) {
                setShouldPulse(true);
            }
        }
    }, []);

    const handleOpenUpdates = () => {
        setShowUpdates(true);
        localStorage.setItem("stardewdle-lastUpdateSeen", new Date().toISOString());
        setShouldPulse(false);
    };

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                const todayStr = new Date().toISOString().split("T")[0];
                const storedDate = localStorage.getItem("stardewdle-date");

                if (storedDate !== todayStr) {
                    console.log("New day detected! Resetting local storage...");

                    const keysToKeep = [
                        "stardewdle-stats",
                        "isMuted",
                        "stardewdle-hasSeenHelpModal",
                        "stardewdle-lastUpdateSeen",
                        "stardewdle-crops",
                        "stardewdle-cooking",
                        "stardewdle-minerals",
                        "stardewdle-fish",
                        "stardewdle-quotes"
                    ];

                    Object.keys(localStorage).forEach((key) => {
                        if (!keysToKeep.includes(key)) {
                            localStorage.removeItem(key);
                        }
                    });
                    localStorage.setItem("stardewdle-date", todayStr);
                }

                const loadOrFetch = async (storageKey, fileName) => {
                    const saved = localStorage.getItem(storageKey);
                    if (saved) {
                        try {
                            const parsed = JSON.parse(saved);
                            if (parsed && (parsed.length > 0 || Object.keys(parsed).length > 0)) {
                                return parsed;
                            }
                        } catch (e) {
                            console.warn(`Cache corrupted for ${storageKey}, refetching...`);
                        }
                    }

                    const res = await fetch(`${import.meta.env.VITE_BUCKET_URL}/data/${fileName}?v=20260906`);
                    if (res.ok) {
                        const data = await res.json();
                        localStorage.setItem(storageKey, JSON.stringify(data));
                        return data;
                    }
                    return [];
                };

                const [
                    cropsData,
                    cookingData,
                    mineralsData,
                    fishData,
                    quotesData
                ] = await Promise.all([
                    loadOrFetch("stardewdle-crops", "crops.json"),
                    loadOrFetch("stardewdle-cooking", "cooking.json"),
                    loadOrFetch("stardewdle-minerals", "geology.json"),
                    loadOrFetch("stardewdle-fish", "fish.json"),
                    loadOrFetch("stardewdle-quotes", "quotes.json")
                ]);

                setCrops(cropsData);
                setCooking(cookingData);
                setMinerals(mineralsData);
                setFish(fishData);
                setQuotes(quotesData);

                const lambdaResponse = await fetch(import.meta.env.VITE_API_URL + "/word");
                if (lambdaResponse.ok) {
                    const lambdaData = await lambdaResponse.json();

                    const correctCropObj = cropsData.find(
                        (c) => c.name.toLowerCase() === lambdaData.word.toLowerCase()
                    );

                    setDailyData({
                        correctCrop: { ...correctCropObj, date: lambdaData.correct_date },
                        dailyItems: lambdaData.daily_items || null,
                        stats: {
                            correctGuesses: lambdaData.correct_guesses,
                            totalGuesses: lambdaData.total_guesses
                        },
                        bundleCompletions: lambdaData.bundle_completions ?? 0
                    });
                }

                setIsReady(true);
            } catch (error) {
                console.error("Failed to initialize game data:", error);
            }
        };

        fetchGlobalData();
    }, []);

    return (
        <GameDataContext.Provider
            value={{
                crops,
                cooking,
                minerals,
                fish,
                quotes,
                dailyData,
                isReady,
                showUpdates,
                setShowUpdates,
                shouldPulse,
                handleOpenUpdates
            }}
        >
            {children}
        </GameDataContext.Provider>
    );
};

export const useGameData = () => useContext(GameDataContext);