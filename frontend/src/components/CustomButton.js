import React from 'react';

const CustomButton = ({
    icon,
    label,
    onClick,
    isMuted,
    variant = 'icon', // default to 'icon' if not provided
    soundPath,
    className = "",
    shouldPulse = false,
    showLabel = false,
    mobilePortrait = false,
}) => {

    // Mapping variants to Tailwind classes
    const variantStyles = {
        icon: mobilePortrait ? "w-[75px] h-[75px]" : "w-[50px] h-[50px]",      // Top right utility buttons
        square: "w-[75px] h-[75px]",    // GitHub, Discord, Credits
        menu: "w-[370px] h-[75px]",     // Play, Collections
        title: "w-[624px] h-[114px]",   // Main Logo/Home button
        submit: "w-[216px] h-[80px]",     // Submit button
        share: "w-10 h-10",          // Share button
        toggle: "w-[30px] h-[30px] md:w-[50px] md:h-[50px]", // Toggle buttons in Hints Modal
    };

    // Determine default sound based on variant
    const defaultSound = (variant === 'menu' || variant === 'title')
        ? "/sounds/menu-select.mp3"
        : variant === 'square'
            ? "/sounds/mouseClick.mp3"
            : "/sounds/pluck.mp3";

    const handleClick = () => {
        if (!isMuted) {
            // Use passed soundPath or the default for that variant
            new Audio(soundPath || defaultSound).play().catch(() => { });
        }
        onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative clickable transition-transform duration-200 hover:scale-105 active:scale-95 
        ${variantStyles[variant] || variantStyles.icon} 
        ${shouldPulse ? "animate-bounceHard" : ""} 
        ${className}`}
        >
            {/* Base Image */}
            <img src={icon} alt={label} className="w-full h-full object-contain" />

            {/* Multiply Overlay (Replaces separate hover images) */}
            {variant !== "title" && (
                <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                    style={{
                        // This tells the browser: "Only show this black tint where the icon image exists"
                        WebkitMaskImage: `url(${icon})`,
                        maskImage: `url(${icon})`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                    }}
                />
            )}

            {/* Optional Tooltip Label */}
            {showLabel && (
                <div
                    className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-[#BC6131] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
                    style={{
                        backgroundImage: "url('/images/label.webp')",
                        backgroundSize: "100% 100%",
                        backgroundRepeat: "no-repeat",
                        height: "28px",
                    }}
                >
                    {label}
                </div>
            )}
        </div>
    );
};

export default CustomButton;