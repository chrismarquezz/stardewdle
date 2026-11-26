const tailwindPlugin = require('tailwindcss/plugin');

const mainColor = '#BC6131';
const mainDarkColor = '#984318';
const alternativeDarkColor = '#391D0B';
const correctColor = '#1E9365';
const correctDarkColor = '#31610d';
const wrongColor = '#BE2617';
const wrongDarkColor = '#9B2A1D';

function toRgbChannels(hexColor) {
  return hexColor
    .slice(1)
    .match(/.{2}/g)
    .map((channel) => parseInt(channel, 16))
    .join(' ');
}

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        stardew: ["Stardew", "sans-serif"],
      },
      colors: {
        'main': 'rgb(var(--main-color) / <alpha-value>)',
        'correct': 'rgb(var(--correct-color) / <alpha-value>)',
        'wrong': 'rgb(var(--wrong-color) / <alpha-value>)',
        'main-dark': mainDarkColor,
        'alternative-dark': 'rgb(var(--alternative-dark-color) / <alpha-value>)',
      },
      screens: {
        "3xl": "1700px",
        "4xl": "2000px",
        "5xl": "2200px",
      },
      keyframes: {
        bounceHard: {
          "0%, 100%": { transform: "translateY(0)" },
          "30%": { transform: "translateY(-10px)" },
          "50%": { transform: "translateY(0)" },
        },
      },
      animation: {
        bounceHard: "bounceHard 1s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    tailwindPlugin(({ addBase }) => {
      addBase({
        ':root': {
          '--main-color': toRgbChannels(mainColor),
          '--correct-color': toRgbChannels(correctColor),
          '--wrong-color': toRgbChannels(wrongColor),
          '--alternative-dark-color': toRgbChannels(mainColor),
          '--scrollbar-track-color': '#FFD788',
          '--scrollbar-thumb-color': 'rgb(var(--main-color))',
        },
        ':root[data-theme="dark"]': {
          '--main-color': toRgbChannels(mainDarkColor),
          '--correct-color': toRgbChannels(correctDarkColor),
          '--wrong-color': toRgbChannels(wrongDarkColor),
          '--alternative-dark-color': toRgbChannels(alternativeDarkColor),
          '--scrollbar-track-color': '#663A28',
          '--scrollbar-thumb-color': 'rgb(var(--alternative-dark-color))',
        },
      });
    }),
  ],
};
