import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#DC2626",
          hover: "#B91C1C",
          light: "#FEE2E2",
          dark: "#7F1D1D",
        },
        dark: {
          bg: "#0D0D0D",
          surface: "#1A1A1A",
          card: "#262626",
          border: "#333333",
          text: "#FFFFFF",
          muted: "#A0A0A0",
        },
        light: {
          bg: "#FFFFFF",
          surface: "#F5F5F5",
          text: "#1A1A1A",
          muted: "#666666",
          border: "#E0E0E0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
