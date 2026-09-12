export function todaysDate() {
    const today = new Date(new Date().toUTCString());
    return `${today.getUTCMonth() + 1}/${today.getUTCDate()}/${today.getUTCFullYear()}`;
}

export function getTimeUntilMidnightUTC() {
    const now = new Date();
    const utcNow = new Date(now.toUTCString());
    const utcMidnight = new Date(
        Date.UTC(
            utcNow.getUTCFullYear(),
            utcNow.getUTCMonth(),
            utcNow.getUTCDate() + 1,
            0, 0, 0
        )
    );
    const diff = utcMidnight - utcNow;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
}