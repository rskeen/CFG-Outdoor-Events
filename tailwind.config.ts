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
        bg: "#F7F4EF",
        surface: "#FFFFFF",
        "surface-2": "#EDE9E2",
        accent: "#1E5B3A",
        "accent-warm": "#C4602A",
        "text-primary": "#1C1C1A",
        "text-muted": "#6E6860",
        border: "#D6D0C8",
        // Race type colors (adjusted for light backgrounds)
        trail: "#166534",
        ultra: "#14532d",
        ocr: "#c2410c",
        adventure: "#b91c1c",
        orienteering: "#0f766e",
        mtb: "#92400e",
        gravel: "#b45309",
      },
      fontFamily: {
        display: ["Barlow Condensed", "Bebas Neue", "sans-serif"],
        body: ["IBM Plex Sans", "Source Sans 3", "sans-serif"],
        sans: ["IBM Plex Sans", "Source Sans 3", "sans-serif"],
      },
      borderColor: {
        DEFAULT: "#D6D0C8",
      },
    },
  },
  plugins: [],
};

export default config;
