import { useState, useEffect } from "react";
import { getTimeUntilMidnightUTC } from "../utils/dateUtils";

export function useTimeUntilMidnightUTC() {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilMidnightUTC);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilMidnightUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}
