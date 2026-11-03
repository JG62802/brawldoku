/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Lilita One"', 'Impact', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Explicit flat Brawl Stars color tokens (used by bg-brawl-*, text-brawl-*, border-brawl-*, ring-brawl-*)
        'brawl-blue': '#1E5AF6',
        'brawl-blue-dark': '#143FB5',
        'brawl-blue-deep': '#0E2B7A',
        'brawl-blue-light': '#3B74FF',
        'brawl-blue-sky': '#EAF1FF',
        'brawl-yellow': '#FFC700',
        'brawl-yellow-hover': '#FFD426',
        'brawl-yellow-pale': '#FFF7CC',
        'brawl-orange': '#FF7800',
        'brawl-orange-hover': '#FF8C1A',
        'brawl-orange-pale': '#FFEDD5',
        'brawl-red': '#E63946',
        'brawl-red-dark': '#B91C28',
        'brawl-red-pale': '#FFE5E8',
        'brawl-green': '#1FC75A',
        'brawl-green-dark': '#15803D',
        'brawl-green-pale': '#DCFCE7',
        'brawl-navy': '#0B132B',
        'brawl-navy-soft': '#1C2541',
        'brawl-navy-muted': '#475569',
        // Semantic tokens mapped to the Brawl Stars palette
        ink: {
          DEFAULT: '#0B132B',
          soft: '#1C2541',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          muted: '#EAF1FF',
          subtle: '#DCE7FF',
        },
        line: {
          DEFAULT: '#0B132B',
          soft: '#CBD5E1',
          strong: '#0B132B',
        },
        mute: '#475569',
        correct: {
          DEFAULT: '#15803D',
          vivid: '#1FC75A',
          bg: '#DCFCE7',
          line: '#1FC75A',
        },
        wrong: {
          DEFAULT: '#E63946',
          bg: '#FFE5E8',
          line: '#E63946',
        },
      },
      boxShadow: {
        brawl: '0 4px 0 #0B132B',
        'brawl-sm': '0 3px 0 #0B132B',
        'brawl-xs': '0 2px 0 #0B132B',
        'brawl-lg': '0 6px 0 #0B132B',
        card: '0 4px 0 #0B132B',
        modal: '0 8px 0 #0B132B, 0 24px 48px rgba(11, 19, 43, 0.45)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'modal-in': {
          from: { opacity: '0', transform: 'translateY(8px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'modal-in': 'modal-in 170ms cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
