import { useEffect } from "react";
import { utcDateString } from "../utils/dateUtils";

// Reloads a tab left open across midnight UTC so it picks up the new daily puzzle.
export function useMidnightRefresh() {
  useEffect(() => {
    const openedOn = utcDateString();

    const interval = setInterval(() => {
      if (utcDateString() !== openedOn) {
        console.log("Midnight UTC passed, reloading...");
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);
}
