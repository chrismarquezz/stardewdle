import React from 'react';
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

    const variantStyles = {
        icon: mobilePortrait ? "w-[75px] h-[75px]" : "w-[50px] h-[50px]",      // Top right utility buttons
        square: "w-[75px] h-[75px]",    // GitHub, Discord, Credits
        menu: "w-[370px] h-[75px]",     // Play, Collections
        title: "w-[624px] h-[114px]",   // Main Logo/Home button
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
                        src={BACKGROUND_IMAGES[variant]}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                    />
                )}
                {icon && (
                    <img
                        src={icon}
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
                    <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                        style={{
                            WebkitMaskImage: `url(${isLayered ? BACKGROUND_IMAGES[variant] : icon})`,
                            maskImage: `url(${isLayered ? BACKGROUND_IMAGES[variant] : icon})`,
                            WebkitMaskSize: 'contain',
                            maskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            maskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center',
                            maskPosition: 'center',
                        }}
                    />
                )}


                {showLabel && (
                    <div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center justify-center text-lg font-medium text-main text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap"
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
            <div className='absolute flex justify-center items-center w-full'>
                {children}
            </div>
        </div >
    );
};

export default CustomButton;