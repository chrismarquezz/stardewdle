import React, { useRef, useEffect } from 'react';

export default function SpritePixelator({
    sheetName,
    colIndex,
    rowIndex = 0,
    spriteSize = 48,
    pixelBlockLevel = 1
}) {
    const canvasRef = useRef(null);
    const bucketUrl = import.meta.env.VITE_BUCKET_URL;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();

        img.src = `${bucketUrl}/sprites/${sheetName}.webp?v=20260821`;

        img.onload = () => {
            const sourceX = colIndex * spriteSize;
            const sourceY = rowIndex * spriteSize;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(
                img,
                sourceX, sourceY, spriteSize, spriteSize,
                0, 0, canvas.width, canvas.height
            );
        };
    }, [sheetName, colIndex, rowIndex, spriteSize, pixelBlockLevel, bucketUrl]);

    const internalResolution = Math.max(1, Math.floor(spriteSize / pixelBlockLevel));

    return (
        <canvas
            ref={canvasRef}
            width={internalResolution}
            height={internalResolution}
            style={{
                backgroundImage: "url('/images/minigames/boxMediumInner.webp')",
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                width: '192px',
                height: '192px',
                imageRendering: 'pixelated',
                transition: 'width 0.3s, height 0.3s'
            }}
        />
    );
}