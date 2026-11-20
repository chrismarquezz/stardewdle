export const getSpriteStyle = (sheetName, colIndex, rowIndex = 0, spriteSize = 16) => {
    const displayScale = sheetName === "villagers" ? 2 : 3;

    return {
        backgroundImage: `url(${import.meta.env.VITE_BUCKET_URL}/sprites/${sheetName}.webp?v=20261119)`,
        backgroundPosition: `-${colIndex * spriteSize}px -${rowIndex * spriteSize}px`,
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        zoom: displayScale,
        imageRendering: 'pixelated',
        backgroundRepeat: 'no-repeat'
    };
};