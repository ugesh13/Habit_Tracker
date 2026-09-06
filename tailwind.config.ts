import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF9F6',
        ink: '#1C1B1A',
        sage: { DEFAULT: '#4F6F52', light: '#7FA07F', dark: '#3A5240' },
        clay: '#C97B5C',
        lavender: '#8B7FA8',
        hairline: '#E3E0D8',
        dark: {
          bg: '#14161A',
          surface: '#1D2024',
          text: '#EDEBE6',
          hairline: '#2A2E33',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '10px' },
    },
  },
  plugins: [],
};
export default config;
