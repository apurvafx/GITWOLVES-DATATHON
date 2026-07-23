/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F3F4F6", // LEXA soft grey background
        card: "#FFFFFF",       // Pure white cards
        textPrimary: "#1F2937", // Slate dark text
        textSecondary: "#4B5563", // Muted grey text
        accentNavy: "#1E3A8A",   // Muted deep blue
        accentPurple: "#7C3AED", // Muted purple
        accentGreen: "#10B981",  // Forest green status
        accentRed: "#EF4444",    // Alert red status
        accentAmber: "#F59E0B"   // Warning yellow status
      }
    },
  },
  plugins: [],
}
