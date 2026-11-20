const tailwindPlugin = require('tailwindcss/plugin');

const mainColor = '#BC6131';
const mainDarkColor = '#984318';

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
        'correct': '#1E9365',
        'wrong': '#BE2617',
        'main-dark': mainDarkColor
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
        },
        ':root[data-theme="dark"]': {
          '--main-color': toRgbChannels(mainDarkColor),
        },
      });
    }),
  ],
};
