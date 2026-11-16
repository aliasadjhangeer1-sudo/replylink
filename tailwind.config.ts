import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}", "./app/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        // ReplyLink design tokens — §5B. Dark-first.
        ink: {
          950: "#0A0B14", // page bg
          900: "#0F111E",
          800: "#151828",
          700: "#1E2238",
          600: "#2A2F4A",
        },
        brand: {
          violet: "#7C3AED",
          pink: "#EC4899",
          orange: "#F59E0B",
          50: "#F5F3FF", 100: "#EDE9FE", 500: "#7C3AED", 600: "#6D28D9", 700: "#5B21B6",
        },
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Sora'", "Inter", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      borderRadius: { xl: "16px", "2xl": "20px", "3xl": "24px" },
      boxShadow: {
        glow: "0 0 40px rgba(124,58,237,.35), 0 0 80px rgba(236,72,153,.18)",
        card: "0 8px 32px rgba(0,0,0,.35)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg,#7C3AED 0%,#EC4899 50%,#F59E0B 100%)",
        "grid": "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
        "dots": "radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        "float-slow": "float 7s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        "fade-up": "fade-up .5s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
