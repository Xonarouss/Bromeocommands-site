import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bromeo: {
          gold: '#e7b82b',
          gold2: '#e9cd9a',
          bronze: '#b07932',
          ink: '#010101',
          deep: '#3d2f17'
        }
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(231,184,43,0.55), 0 12px 40px rgba(0,0,0,0.45)'
      },
      backgroundImage: {
        'gold-radial': 'radial-gradient(600px circle at var(--x, 50%) var(--y, 20%), rgba(231,184,43,0.18), transparent 50%)'
      }
    }
  },
  plugins: []
} satisfies Config;
