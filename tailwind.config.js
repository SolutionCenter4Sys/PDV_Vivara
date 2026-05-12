/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    /**
     * Breakpoints customizados Vivara · alinhados aos devices reais do PDV
     * sm  · 640px  · phablet (iPhone Pro Max landscape)
     * md  · 768px  · tablet portrait  (iPad 9 retrato, Galaxy Tab S9 retrato)
     * lg  · 1024px · tablet landscape (iPad 9 paisagem, PDV Cegid touch 1024×768)
     * xl  · 1280px · desktop          (notebook gerente)
     * 2xl · 1536px · desktop wide     (display de loja, TV painel NOC)
     * pdv · 1366px · tablet PDV touch (alguns Cegid e Linx · tipico 1366×768)
     */
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      pdv: '1366px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Vivara · Cores oficiais (extraídas do CSS de vivara.com.br)
        coral: {
          50: '#feede4',
          100: '#fde1d5',
          200: '#ffa687',
          300: '#ffa67d',
          400: '#f09c75',
          500: '#f08769',
          DEFAULT: '#ffa687',
        },
        ink: {
          0: '#ffffff',
          1: '#f8f8f8',
          2: '#f0f0f0',
          3: '#c7ccd1',
          4: '#9099a2',
          5: '#737373',
          6: '#3e3e3e',
          7: '#171a1c',
          DEFAULT: '#171a1c',
        },
        border: {
          DEFAULT: '#d2d2d2',
          light: '#f0f0f0',
        },
        danger: {
          DEFAULT: '#bf1c1d',
          light: '#fc295c',
        },
        success: {
          DEFAULT: '#1a8a86',
          light: '#b3ebd5',
        },
        warning: {
          DEFAULT: '#e1a91f',
          light: '#fff5e6',
        },
        life: {
          DEFAULT: '#e91e63',
        },
        gold: {
          DEFAULT: '#c9a35b',
        },
      },
      fontFamily: {
        sans: ['Roboto', '-apple-system', 'system-ui', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'Consolas', 'monospace'],
      },
      borderRadius: {
        none: '0',
        DEFAULT: '0',
        pill: '100px',
        full: '9999px',
      },
      boxShadow: {
        hover: '0 2px 3px rgba(0,0,0,.1)',
        darker: '0 0 10px rgba(0,0,0,.2)',
        modal: '0 20px 50px rgba(0,0,0,0.2)',
        elevated: '0 -8px 24px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        'grid': '1280px',
        'grid-wide': '1440px',
      },
      minHeight: {
        'screen-d': '100dvh',
      },
      height: {
        'screen-d': '100dvh',
      },
      fontSize: {
        'fluid-hero': ['clamp(2rem, 6vw + 1rem, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-1px' }],
        'fluid-h1': ['clamp(1.75rem, 4vw + 1rem, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.5px' }],
        'fluid-h2': ['clamp(1.5rem, 3vw + 0.5rem, 2.25rem)', { lineHeight: '1.15', letterSpacing: '-0.5px' }],
        'fluid-h3': ['clamp(1.125rem, 1.5vw + 0.5rem, 1.5rem)', { lineHeight: '1.3' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      letterSpacing: {
        'cta': '0.1em',
        'label': '0.12em',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-coral': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(240,135,105,0.6)' },
          '50%': { boxShadow: '0 0 0 12px rgba(240,135,105,0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        'pulse-coral': 'pulse-coral 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
