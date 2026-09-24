import { createContext, useCallback, useContext, useRef, useState, useEffect } from "react";

const GameDataContext = createContext();
const MOST_RECENT_UPDATE = "2026-11-9T00:00:00Z";

const DATA_VERSION = "20260921";
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJSON(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Request to ${url} failed with status ${res.status}`);
    return res.json();
}

async function withRetry(task, signal) {
    let lastError;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
            return await task();
        } catch (error) {
            if (signal?.aborted) throw error;
            lastError = error;
            console.warn(`Attempt ${attempt + 1} of ${MAX_ATTEMPTS} failed:`, error);
            if (attempt < MAX_ATTEMPTS - 1) await sleep(RETRY_BASE_MS * 2 ** attempt);
        }
    }
    throw lastError;
}

const KEYS_TO_KEEP = [
    "stardewdle-stats",
    "isMuted",
    "stardewdle-hasSeenHelpModal",
    "stardewdle-hasSeenCollectionsModal",
    "stardewdle-minigameHelpSeen",
    "stardewdle-lastUpdateSeen",
    "stardewdle-crops",
    "stardewdle-cooking",
    "stardewdle-minerals",
    "stardewdle-fish",
    "stardewdle-quotes"
];

// Must run before any component reads its day-scoped state, so this is called at import time
// rather than in an effect (effects fire after children have already initialised from storage).
function resetDailyStorageIfNeeded() {
    const todayStr = new Date().toISOString().split("T")[0];
    if (localStorage.getItem("stardewdle-date") === todayStr) return;

    console.log("New day detected! Resetting local storage...");

    Object.keys(localStorage).forEach((key) => {
        // Legacy per-minigame help flags are kept until MinigamesBox migrates them.
        const isLegacyMinigameHelpFlag = key.startsWith("stardewdle-hasSeenMinigame");
        if (!KEYS_TO_KEEP.includes(key) && !isLegacyMinigameHelpFlag) {
            localStorage.removeItem(key);
        }
    });
    localStorage.setItem("stardewdle-date", todayStr);
}

resetDailyStorageIfNeeded();

export const GameDataProvider = ({ children }) => {
    const [crops, setCrops] = useState([]);
    const [cooking, setCooking] = useState([]);
    const [minerals, setMinerals] = useState([]);
    const [fish, setFish] = useState([]);
    const [quotes, setQuotes] = useState([]);

    const [dailyData, setDailyData] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const activeLoad = useRef(null);

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

    const loadGameData = useCallback(async () => {
        activeLoad.current?.abort();
        const controller = new AbortController();
        activeLoad.current = controller;
        const signal = controller.signal;

        setIsReady(false);
        setLoadError(null);

        const fetchStaticData = (fileName) =>
            withRetry(
                () => fetchJSON(`${import.meta.env.VITE_BUCKET_URL}/data/${fileName}?v=${DATA_VERSION}`, signal),
                signal
            );

        const loadOrFetch = async (storageKey, fileName) => {
            const saved = localStorage.getItem(storageKey);
            if (saved && storageKey !== "stardewdle-cooking") {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed && (parsed.length > 0 || Object.keys(parsed).length > 0)) {
                        return parsed;
                    }
                } catch (e) {
                    console.warn(`Cache corrupted for ${storageKey}, refetching...`);
                }
            }

            const data = await fetchStaticData(fileName);
            localStorage.setItem(storageKey, JSON.stringify(data));
            return data;
        };

        try {
            let [
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

            const lambdaData = await withRetry(
                () => fetchJSON(import.meta.env.VITE_API_URL + "/word", signal),
                signal
            );

            if (!lambdaData?.word) throw new Error("Daily crop missing from the server response.");

            const findCrop = (list) =>
                list.find((c) => c.name.toLowerCase() === lambdaData.word.toLowerCase());

            let correctCropObj = findCrop(cropsData);

            // A cached crop list can predate the daily crop, so refetch before giving up.
            if (!correctCropObj) {
                console.warn(`"${lambdaData.word}" missing from cached crops, refetching...`);
                cropsData = await fetchStaticData("crops.json");
                localStorage.setItem("stardewdle-crops", JSON.stringify(cropsData));
                correctCropObj = findCrop(cropsData);
            }

            if (!correctCropObj) throw new Error(`Crop "${lambdaData.word}" is not in the crop data.`);

            if (signal.aborted) return;

            setCrops(cropsData);
            setDailyData({
                correctCrop: { ...correctCropObj, date: lambdaData.correct_date },
                dailyItems: lambdaData.daily_items || null,
                stats: {
                    correctGuesses: lambdaData.correct_guesses,
                    totalGuesses: lambdaData.total_guesses
                },
                bundleCompletions: lambdaData.bundle_completions ?? 0,
                bundleSuccesses: lambdaData.bundle_successes ?? 0
            });
            setIsReady(true);
        } catch (error) {
            if (signal.aborted) return;
            console.error("Failed to initialize game data:", error);
            setIsReady(false);
            setLoadError(error.message || "Failed to load today's game.");
        }
    }, []);

    useEffect(() => {
        loadGameData();
    }, [loadGameData]);

    // A failed load leaves the app on the loading screen, so pick it back up as soon as the
    // connection or the tab comes back instead of waiting for a manual refresh.
    useEffect(() => {
        if (!loadError) return;

        const retry = () => {
            if (!document.hidden) loadGameData();
        };

        window.addEventListener("online", retry);
        document.addEventListener("visibilitychange", retry);

        return () => {
            window.removeEventListener("online", retry);
            document.removeEventListener("visibilitychange", retry);
        };
    }, [loadError, loadGameData]);

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
                loadError,
                reloadGameData: loadGameData,
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