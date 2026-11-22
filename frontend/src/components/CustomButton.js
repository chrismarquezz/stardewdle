import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useThemedAsset } from '../hooks/useThemedAsset';
import CursorTooltip from './CursorTooltip';
import { playSound } from '../utils/playSound';

const LAYERED_VARIANTS = ['icon', 'menu', 'square', 'toggle'];
const BACKGROUND_IMAGES = {
    icon: "/images/buttons/button-base.webp",
    menu: "/images/buttons/menu-base.webp",
    square: "/images/buttons/square-base.webp",
    toggle: "/images/buttons/button-base.webp",
};

const CustomButton = ({
    icon,
    showX = false,
    layered = true,
    label,
    onClick,
    isMuted,
    variant = 'icon', // default to 'icon' if not provided
    soundPath,
    className = "",
    shouldPulse = false,
    showLabel = false,
    mobilePortrait = false,
    children
}) => {
    const { theme } = useTheme();
    const backgroundImage = useThemedAsset(
        BACKGROUND_IMAGES[variant] || BACKGROUND_IMAGES.icon,
        theme
    );
    const themedIcon = useThemedAsset(
        icon || "",
        theme
    );
    const buttonIcon = icon ? themedIcon : icon;

    const variantStyles = {
        icon: mobilePortrait ? "w-[75px] h-[75px]" : "w-[50px] h-[50px]",      // Top right utility buttons
        square: "w-[75px] h-[75px]",    // GitHub, Discord, Credits
        menu: "w-[370px] h-[75px]",     // Play, Collections
        title: "w-[624px] h-[114px] z-30",   // Main Logo/Home button
        submit: "w-[216px] h-[80px]",     // Submit button
        share: "w-10 h-10",          // Share button
        toggle: "w-[30px] h-[30px] md:w-[50px] md:h-[50px]", // Toggle buttons in Hints Modal
    };

    const isLayered = layered && LAYERED_VARIANTS.includes(variant);

    const defaultSound = (variant === 'menu' || variant === 'title')
        ? "/sounds/menu-select.mp3"
        : variant === 'square'
            ? "/sounds/mouseClick.mp3"
            : "/sounds/pluck.mp3";

    const handleClick = () => {
        if (!isMuted) {
            playSound(soundPath || defaultSound);
        }
        onClick();
    };

    return (
        <div className='relative'>
            <CursorTooltip label={showLabel ? label : null} fontSizeClassName="text-lg">
                <div
                    onClick={handleClick}
                    className={`group relative clickable transition-transform duration-200 hover:scale-105 active:scale-95 
                            ${variantStyles[variant] || variantStyles.icon}
                            ${shouldPulse ? "animate-bounceHard" : ""} 
                            ${className}`
                    }
                >
                    {isLayered && (
                        <img
                            src={backgroundImage}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />
                    )}
                    {buttonIcon && (
                        <img
                            src={buttonIcon}
                            alt={label}
                            className={isLayered
                                ? "absolute inset-0 w-full h-full object-contain pointer-events-none"
                                : "w-full h-full object-contain"}
                        />
                    )}
                    {showX && (
                        <img
                            src="/images/buttons/button-off.webp"
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        />
                    )}

                    {variant !== "title" && (
                        <div className={`absolute inset-0 ${theme === "dark" ? "bg-white/30" : "bg-white/50"} mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none`}
                            style={{
                                WebkitMaskImage: `url(${isLayered ? backgroundImage : buttonIcon})`,
                                maskImage: `url(${isLayered ? backgroundImage : buttonIcon})`,
                                WebkitMaskSize: 'contain',
                                maskSize: 'contain',
                                WebkitMaskRepeat: 'no-repeat',
                                maskRepeat: 'no-repeat',
                                WebkitMaskPosition: 'center',
                                maskPosition: 'center',
                            }}
                        />
                    )}
                </div>
            </CursorTooltip>
            <div className='absolute flex justify-center items-center w-full'>
                {children}
            </div>
        </div >
    );
};

export default CustomButton;