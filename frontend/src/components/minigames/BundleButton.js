import React, { useState, useEffect } from 'react';

export default function BundleButton({
    variant = 1,
    label,
    onClick,
    isMuted,
    isAnimated = false,
    skipAnimation = false,
    onAnimationComplete,
    positionClass = "",
}) {
    const bundleScale = 4;
    const baseSpriteWidth = 16;
    const totalFrames = 16;
    const frameRateMs = 100;

    const [currentFrame, setCurrentFrame] = useState(skipAnimation && isAnimated ? totalFrames - 1 : 0);

    const xPos = -(currentFrame * baseSpriteWidth * bundleScale);
    const yPos = -((variant - 1) * 32 * bundleScale);
    const iconSize = baseSpriteWidth * bundleScale;

    useEffect(() => {
        if (!isAnimated || skipAnimation || currentFrame > totalFrames - 1) return;

        const timer = setInterval(() => {
            setCurrentFrame((prevFrame) => {
                if (prevFrame < totalFrames - 1) {
                    return prevFrame + 1;
                }

                clearInterval(timer);
                if (onAnimationComplete) onAnimationComplete();
                return prevFrame;
            });
        }, frameRateMs);

        return () => clearInterval(timer);
    }, [isAnimated, currentFrame, onAnimationComplete]);

    const handleClick = () => {
        if (!isMuted) {
            new Audio("/sounds/pluck.mp3").play().catch(() => { });
        }
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={"group absolute clickable transition-transform duration-200 hover:scale-105 active:scale-95 -translate-y-1/2 -translate-x-1/2 " + positionClass}
        >
            <div
                className="transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{
                    backgroundImage: "url(/images/minigames/bundles.webp)",
                    backgroundPosition: `${xPos}px ${yPos}px`,
                    backgroundSize: `${256 * bundleScale}px ${112 * bundleScale}px`,
                    width: iconSize,
                    height: iconSize,
                    imageRendering: 'pixelated',
                }}
            />

            <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-main text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
                style={{
                    backgroundImage: "url('/images/label.webp')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    height: "28px",
                }}
            >
                {label} Bundle
            </div>
        </div>
    );
}