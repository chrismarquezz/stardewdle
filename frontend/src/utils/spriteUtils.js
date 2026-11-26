export const getSpriteStyle = (
    sheetName,
    colIndex,
    rowIndex = 0,
    spriteSize = 16,
    theme = "light",
    scaleMultiplier = 1
) => {
    const baseScale = sheetName === "villagers" ? 2 : 3;
    const boxSize = spriteSize * baseScale;
    const extra = boxSize - spriteSize;
    const scale = baseScale * scaleMultiplier;
    const centerOffset = (boxSize - spriteSize * scale) / 2;

    return {
        backgroundImage: `url(${import.meta.env.VITE_BUCKET_URL}/sprites/${sheetName}.webp?v=20261119)`,
        backgroundPosition: `-${colIndex * spriteSize}px -${rowIndex * spriteSize}px`,
        backgroundRepeat: 'no-repeat',
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        margin: `0 ${extra}px ${extra}px 0`,
        scale: String(scale),
        transformOrigin: "top left",
        translate: `${centerOffset}px ${centerOffset}px`,
        imageRendering: 'pixelated',
        ...(theme === "dark" ? { filter: "brightness(90%)" } : {}),
    };
};