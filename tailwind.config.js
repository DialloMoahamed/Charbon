/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette officielle — cahier des charges §14 (Direction artistique / UI)
        void: "#171717", // couleur primaire — header, texte fort, navigation
        voidsoft: "#262626",
        voidline: "#404040",
        sack: "#78350F", // brun terre — catégories, accents naturels
        sacklight: "#92400E",
        ember: "#D97706", // orange feu — CTA, prix, états d'action
        emberdeep: "#B45309",
        paper: "#FAFAF9", // fond clair — arrière-plan principal
        paperdeep: "#F5F1E8", // beige sable — sections, surfaces
        ash: "#78716C",
        ashlight: "#A8A29E",
        leaf: "#16A34A",
        steel: "#57534E",
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        wuta: "14px",
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
