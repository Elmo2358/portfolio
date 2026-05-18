import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Euclid Circular A", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Source Code Pro", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "hero-display": ["72px", { lineHeight: "1.10", letterSpacing: "-1.5px", fontWeight: "500" }],
        "display-lg": ["56px", { lineHeight: "1.15", letterSpacing: "-1px", fontWeight: "500" }],
        "heading-1": ["48px", { lineHeight: "1.20", letterSpacing: "-0.5px", fontWeight: "500" }],
        "heading-2": ["36px", { lineHeight: "1.25", letterSpacing: "-0.5px", fontWeight: "500" }],
        "heading-3": ["28px", { lineHeight: "1.30", fontWeight: "500" }],
        "heading-4": ["22px", { lineHeight: "1.35", fontWeight: "500" }],
        "heading-5": ["18px", { lineHeight: "1.40", fontWeight: "600" }],
        "subtitle": ["18px", { lineHeight: "1.50", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.55", fontWeight: "400" }],
        "body-md-medium": ["16px", { lineHeight: "1.55", fontWeight: "500" }],
        "body-sm": ["14px", { lineHeight: "1.50", fontWeight: "400" }],
        "body-sm-medium": ["14px", { lineHeight: "1.50", fontWeight: "500" }],
        "caption": ["13px", { lineHeight: "1.40", fontWeight: "400" }],
        "caption-bold": ["13px", { lineHeight: "1.40", fontWeight: "600" }],
        "micro": ["12px", { lineHeight: "1.40", fontWeight: "500" }],
        "micro-uppercase": ["11px", { lineHeight: "1.40", fontWeight: "600", letterSpacing: "1px" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // MongoDB Brand Colors
        mongo: {
          green: "#00ed64",
          "green-dark": "#00684a",
          "green-mid": "#00a35c",
          "green-soft": "#c3f0d2",
          "teal-deep": "#001e2b",
          teal: "#003d4f",
          "teal-mid": "#00684a",
          "accent-purple": "#7b3ff2",
          "accent-orange": "#fa6e39",
          "accent-pink": "#f06bb8",
          "accent-blue": "#3d4f9f",
          canvas: "#ffffff",
          "canvas-dark": "#001e2b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "4px",
        xl: "16px",
        xxl: "24px",
      },
      spacing: {
        xxs: "4px",
        section: "64px",
        "section-lg": "96px",
        hero: "120px",
        xxxl: "40px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
