/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#f8f6f1',
          dark: '#f0ede6',
        },
        navy: {
          DEFAULT: '#1a2332',
          light: '#2d3748',
        },
        'blue-soft': '#6b8cae',
        'blue-accent': '#4479e1',
        'text-primary': '#1a2332',
        'text-secondary': '#5a6578',
        'text-muted': '#8b95a5',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'card': '0 2px 16px rgba(26, 35, 50, 0.04)',
        'card-hover': '0 8px 32px rgba(26, 35, 50, 0.08)',
      },
    },
  },
  plugins: [],
}
