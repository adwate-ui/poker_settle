import type { Config } from "tailwindcss";

/**
 * Design system reference — check new work against this before inventing a new size/radius/gap.
 *
 * Typography roles:
 *   Eyebrow/caption (muted all-caps label above a value) -> .text-label (index.css)
 *   Stat/KPI number (big number with a caption)           -> text-2xl font-bold font-numbers
 *   Dense table/list body text                             -> text-tiny
 *   Body copy                                               -> text-sm
 *   Card title, page-level                                  -> CardTitle default (text-2xl)
 *   Card title, compact/dashboard-tile                      -> text-lg (the only allowed override)
 *   Section header (collapsible/sub-section titles)         -> text-lg font-luxury uppercase tracking-widest
 *
 * Radius hierarchy:
 *   rounded-lg    small interactive controls (inputs, selects, buttons, small info tiles)
 *   rounded-xl    surfaces (cards, tables, tabs, dropdown content, larger stat tiles)
 *   rounded-2xl   floating/modal surfaces only (dialogs)
 *   rounded-full  pills, avatars, icon chips
 *
 * Spacing rhythm:
 *   Outer page container -> space-y-6
 *   Info tile padding     -> p-4 sm:p-6
 *   Major card/stat grids -> gap-6; denser field grids -> gap-4
 *   CardTitle + CardDescription pair -> always wrap in a div with space-y-1, whether or
 *     not it's preceded by an icon badge. Never let them sit in an unstyled wrapper div
 *     (defaults to a 0px gap) or rely on CardHeader's own space-y-1.5 reaching them.
 *
 * Page shape (the 3 list pages — Games History, Players List, Hands Tracking — plus
 * Overview and New Game as adapted variants):
 *   1. Stats: bare StatTile grid, no wrapping Card/title (nav tab already names the page).
 *      Skip entirely rather than fabricate meaningless tiles (e.g. New Game pre-creation).
 *   2. Primary action or filters: the compact filter-bar style, or an equivalent single
 *      action/description in the same structural slot.
 *   3. Content: table, list, or form.
 *
 * Color: use the CSS-variable-driven poker.gold / poker.felt tokens (theme-aware), not the
 * hardcoded gold and felt hex tokens below (those don't respond to dark mode — reserved for
 * deliberately fixed-tone gradients where a single theme-aware token can't do the job).
 */
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
        'tiny': ['0.75rem', { lineHeight: '1rem' }],
        '2xs': ['0.8125rem', { lineHeight: '1.05rem' }],
        '3xs': ['0.6875rem', { lineHeight: '0.9rem' }],
        'chip-sm': ['0.5rem', { lineHeight: '0.625rem' }],
        'chip-md': ['0.625rem', { lineHeight: '0.75rem' }],
        'chip-lg': ['0.75rem', { lineHeight: '0.875rem' }],
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
          green: "hsl(var(--chip-green))",
          black: "hsl(var(--chip-black))",
          white: "hsl(var(--chip-white))",
          yellow: "hsl(var(--chip-yellow))",
        },
        money: {
          green: "hsl(var(--money-green))",
          red: "hsl(var(--money-red))",
        },
        // Semantic State Colors
        state: {
          success: {
            DEFAULT: "hsl(var(--state-success))",
            foreground: "hsl(var(--state-success-foreground))",
          },
          warning: {
            DEFAULT: "hsl(var(--state-warning))",
            foreground: "hsl(var(--state-warning-foreground))",
          },
          error: {
            DEFAULT: "hsl(var(--state-error))",
            foreground: "hsl(var(--state-error-foreground))",
          },
          info: {
            DEFAULT: "hsl(var(--state-info))",
            foreground: "hsl(var(--state-info-foreground))",
          },
          neutral: {
            DEFAULT: "hsl(var(--state-neutral))",
            foreground: "hsl(var(--state-neutral-foreground))",
          },
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
        'glow-gold-sm': '0 0 15px rgba(212, 184, 60, 0.5)',
        'glow-gold-hover': '0 0 15px rgba(212, 184, 60, 0.2)',
        'glow-gold-subtle': '0 0 50px rgba(212, 184, 60, 0.1)',
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
        shimmer: {
          "0%": {
            "background-position": "200% 0",
          },
          "100%": {
            "background-position": "-200% 0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
