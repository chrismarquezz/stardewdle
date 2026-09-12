export const getSpriteStyle = (sheetName, colIndex, rowIndex = 0, spriteSize = 48) => {
    return {
        backgroundImage: `url(${import.meta.env.VITE_BUCKET_URL}/sprites/${sheetName}.webp?v=20260906)`,
        backgroundPosition: `-${colIndex * spriteSize}px -${rowIndex * spriteSize}px`,
        width: `${spriteSize}px`,
        height: `${spriteSize}px`,
        imageRendering: 'pixelated',
        backgroundRepeat: 'no-repeat'
    };
};