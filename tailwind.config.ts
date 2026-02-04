import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      screens: {
        'xs': '475px',
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.65rem' }],
      },
      colors: {
        suit: {
          red: "hsl(var(--destructive))",
          black: "hsl(var(--foreground))",
        },
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Custom poker theme colors
        poker: {
          green: "hsl(var(--poker-green))",
          gold: "hsl(var(--poker-gold))",
          felt: "hsl(var(--poker-felt))",
          red: "hsl(var(--poker-red))",
          black: "hsl(var(--poker-black))",
        },
        chip: {
          red: "hsl(var(--chip-red))",
          blue: "hsl(var(--chip-blue))",
        },
        money: {
          green: "hsl(var(--money-green))",
          red: "hsl(var(--money-red))",
        },
        // Ultimate Luxury Design System
        gold: {
          100: "#F7E7CE", // Champagne (Highlight)
          200: "#F3E1B9",
          400: "#E6BE8A", // Pale Gold (Base)
          500: "#D4AF37", // Metallic Gold (Mid)
          600: "#B8962E",
          800: "#CD7F32", // Bronze (Shadow)
          900: "#4B3621", // Deep Oak (Text)
        },
        felt: {
          DEFAULT: "#1e3a2d",
          dark: "#1e3a2d",
          texture: "radial-gradient(circle, #244a39 0%, #1e3a2d 100%)",
        },
      },
      backgroundImage: {
        'gradient-poker': 'var(--gradient-poker)',
        'gradient-gold': 'var(--gradient-gold)',
        'gradient-dark': 'var(--gradient-dark)',
        'luxury-gradient': 'linear-gradient(to bottom right, #000000, #1a1a2e)',
        'gold-sheen': 'linear-gradient(45deg, #D4AF37 0%, #F7E7CE 50%, #D4AF37 100%)',
        'specular-gold': 'linear-gradient(135deg, #4B3621 0%, #CD7F32 25%, #F7E7CE 50%, #E6BE8A 55%, #D4AF37 100%)',
        'glass-panel': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(212, 184, 60, 0.4)',
        'chip-depth': '0 6px 0 rgba(0,0,0,0.2), 0 12px 24px rgba(0,0,0,0.3)',
      },
      fontFamily: {
        luxury: ['Playfair Display', 'serif'],
        heading: ['Cinzel', 'serif'],
        numbers: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "table": "var(--poker-table-radius)",
        "table-sm": "var(--poker-table-radius-mobile)",
      },
      zIndex: {
        'player-cards': '5',
        'player-unit': '10',
        'player-badge': '15',
        'poker-overlay': '20',
        'chip-stack': '25',
        'position-label': '30',
        'winner-celebration': '40',
        'confetti': '50',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
