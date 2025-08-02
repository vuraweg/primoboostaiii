/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      // Responsive breakpoints (mobile-first approach)
      screens: {
        'xs': '320px',    // Extra small devices
        'sm': '640px',    // Small devices (tablets)
        'md': '768px',    // Medium devices (small laptops)
        'lg': '1024px',   // Large devices (desktops)
        'xl': '1280px',   // Extra large devices
        '2xl': '1536px',  // 2X large devices
      },
      // Fluid typography using clamp()
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'fluid-base': 'clamp(1rem, 3vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 6vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 7vw, 3rem)',
        'fluid-5xl': 'clamp(3rem, 8vw, 4rem)',
      },
      // Consistent color palette (3-4 primary colors)
      colors: {
        primary: {
          50: '#e0f7fa',   // Lightest Teal
          100: '#b2ebf2',
          200: '#80deea',
          300: '#4dd0e1',
          400: '#26c6da',
          500: '#00bcd4',  // Main Teal
          600: '#00acc1',
          700: '#0097a7',
          800: '#00838f',
          900: '#006064',   // Darkest Teal
        },
        secondary: {
          50: '#fdfdfc',   // Lightest Warm Grey/Beige
          100: '#f8f8f6',
          200: '#f0f0ed',
          300: '#e0e0db',
          400: '#c0c0b8',
          500: '#a0a095',  // Main Warm Grey/Beige
          600: '#808075',
          700: '#606055',
          800: '#404035',
          900: '#202015',   // Darkest Warm Grey/Beige
        },
        accent: {
          50: '#fff3e0',   // Lightest Coral/Orange
          100: '#ffe0b2',
          200: '#ffcc80',
          300: '#ffb74d',
          400: '#ffa726',
          500: '#ff9800',  // Main Coral/Orange
          600: '#fb8c00',
          700: '#f57c00',
          800: '#ef6c00',
          900: '#e65100',   // Darkest Coral/Orange
        }
      },
      // Minimum touch target sizes
      minWidth: {
        'touch': '44px',
        'button': '120px',
      },
      minHeight: {
        'touch': '44px',
        'button': '44px',
      },
      // Additional spacing for better mobile UX
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      maxWidth: {
        '8xl': '88rem',
        'prose': '75ch',
        '10xl':'110rem',
      },
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-3px)' },
          '60%': { transform: 'translateY(-2px)' },
        },
      }
    },
  },
  plugins: [],
};
