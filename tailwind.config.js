/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9ce819',
        'primary-dark': '#7ab810',
        'primary-light': '#bffb4f',
        ink: '#1f2933',
        muted: '#6b7280',
      },
      fontSize: {
        base: 'clamp(0.95rem, 0.9vw + 0.8rem, 1rem)',
        lg: 'clamp(1.05rem, 1.2vw + 0.85rem, 1.25rem)',
        xl: 'clamp(1.25rem, 1.5vw + 1rem, 1.5rem)',
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
