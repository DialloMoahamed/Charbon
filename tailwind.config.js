/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#1B1512",
        voidsoft: "#241C17",
        voidline: "#3A2F26",
        ember: "#FF6B35",
        emberdeep: "#C0432A",
        ash: "#8C8177",
        ashlight: "#C9C0B4",
        paper: "#F2ECE1",
        paperdeep: "#E8DFCF",
        sack: "#5C4A38",
        sacklight: "#7A6248",
        leaf: "#5B7A4A",
        steel: "#5B6472",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      keyframes: {
        rise: {
          "0%": { transform: "translateY(0)", opacity: 0 },
          "15%": { opacity: 1 },
          "100%": { transform: "translateY(-140px)", opacity: 0 },
        },
      },
      animation: {
        rise: "rise 5s linear infinite",
      },
    },
  },
  plugins: [],
};
