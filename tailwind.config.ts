import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f1710",
        surface: "#1a2b1c",
        "surface-2": "#243826",
        accent: "#7cb87a",
        "accent-warm": "#d4845a",
        "text-primary": "#e8ede8",
        "text-muted": "#8a9e8a",
        border: "#2e4530",
        // Race type colors
        trail: "#4ade80",
        ultra: "#166534",
        ocr: "#f97316",
        adventure: "#ef4444",
        orienteering: "#14b8a6",
        mtb: "#92400e",
        gravel: "#d97706",
      },
      fontFamily: {
        display: ["Barlow Condensed", "Bebas Neue", "sans-serif"],
        body: ["IBM Plex Sans", "Source Sans 3", "sans-serif"],
        sans: ["IBM Plex Sans", "Source Sans 3", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "#2e4530",
      },
    },
  },
  plugins: [],
};

export default config;
