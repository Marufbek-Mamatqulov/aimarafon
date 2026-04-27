import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        cardForeground: "rgb(var(--card-foreground) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
      boxShadow: {
        neon: "0 0 32px rgba(34, 211, 238, 0.22)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.2), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34, 211, 238, 0.16), transparent 35%)",
      },
    },
  },
  plugins: [],
};

export default config;
