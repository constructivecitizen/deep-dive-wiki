import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  safelist: [
    // Ensure our custom color classes are included
    'section-bg-1', 'section-bg-2', 'section-bg-3', 'section-bg-4',
    'content-level-1', 'content-level-2', 'content-level-3', 'content-level-4', 'content-level-5', 'content-level-6'
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
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
        // Wiki-specific colors
        hierarchy: {
          line: "hsl(var(--hierarchy-line))",
          hover: "hsl(var(--hierarchy-hover))",
        },
        depth: {
          1: "hsl(var(--depth-bg-1))",
          2: "hsl(var(--depth-bg-2))",
          3: "hsl(var(--depth-bg-3))",
        },
        // Sidebar section backgrounds
        section: {
          1: "hsl(var(--section-bg-1))",
          2: "hsl(var(--section-bg-2))",
          3: "hsl(var(--section-bg-3))",
          4: "hsl(var(--section-bg-4))",
        },
        // Content level colors
        content: {
          1: "hsl(var(--content-level-1))",
          2: "hsl(var(--content-level-2))",
          3: "hsl(var(--content-level-3))",
          4: "hsl(var(--content-level-4))",
          5: "hsl(var(--content-level-5))",
          6: "hsl(var(--content-level-6))",
        },
        // Content border colors
        "content-border": {
          1: "hsl(var(--content-border-1))",
          2: "hsl(var(--content-border-2))",
          3: "hsl(var(--content-border-3))",
          4: "hsl(var(--content-border-4))",
          5: "hsl(var(--content-border-5))",
          6: "hsl(var(--content-border-6))",
        },
        tags: {
          blue: "hsl(var(--tag-blue))",
          green: "hsl(var(--tag-green))",
          purple: "hsl(var(--tag-purple))",
          orange: "hsl(var(--tag-orange))",
          red: "hsl(var(--tag-red))",
          teal: "hsl(var(--tag-teal))",
        },
      },
      fontFamily: {
        'avenir': ['"Nunito Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
