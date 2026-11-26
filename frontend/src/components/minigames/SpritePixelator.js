import React, { useRef, useEffect } from 'react';
import { useTheme } from "../../context/ThemeContext";
import { useThemedAsset } from "../../hooks/useThemedAsset";

export default function SpritePixelator({
    sheetName,
    colIndex,
    rowIndex = 0,
    sourceSpriteSize = 16,
    pixelResolution = sourceSpriteSize
}) {
    const { theme } = useTheme();
    const boxBackground = useThemedAsset("/images/minigames/boxMediumInner.webp", theme);
    const canvasRef = useRef(null);
    const bucketUrl = import.meta.env.VITE_BUCKET_URL;

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const img = new Image();

        img.src = `${bucketUrl}/sprites/${sheetName}.webp?v=20261119`;

        img.onload = () => {
            const sourceX = colIndex * sourceSpriteSize;
            const sourceY = rowIndex * sourceSpriteSize;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(
                img,
                sourceX, sourceY, sourceSpriteSize, sourceSpriteSize,
                0, 0, canvas.width, canvas.height
            );
        };
    }, [sheetName, colIndex, rowIndex, sourceSpriteSize, pixelResolution, bucketUrl]);

    const internalResolution = Math.max(1, Math.min(sourceSpriteSize, Math.floor(pixelResolution)));

    return (
        <canvas
            ref={canvasRef}
            width={internalResolution}
            height={internalResolution}
            style={{
                backgroundImage: `url('${boxBackground}')`,
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