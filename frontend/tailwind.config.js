module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        stardew: ["Stardew", "sans-serif"],
      },
      colors: {
        'main': '#BC6131',
        'correct': '#1E9365',
        'wrong': '#BE2617',
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
  ],
};
