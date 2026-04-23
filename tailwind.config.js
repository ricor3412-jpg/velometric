/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          light: '#60a5fa',
          glow: 'rgba(59, 130, 246, 0.4)',
        },
        secondary: {
          DEFAULT: '#8b5cf6',
          light: '#a855f7',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        background: '#050507',
        foreground: '#ffffff',
        'text-dim': '#52525b',
        'text-muted': '#888891',
        'text-secondary': '#a1a1aa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      letterSpacing: {
        'tighter': '-0.05em',
        'widest': '0.25em',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
