/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0B5ED7',
          600: '#0a4fb8',
          700: '#084fa1',
          900: '#0A2540',
        },
        gray: {
          50: '#F6F8FB',
          100: '#f3f4f6',
          300: '#d1d5db',
          500: '#6B7280',
          900: '#111827',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        hover: '0 4px 12px 0 rgba(11, 94, 215, 0.15)',
      },
    },
  },
  plugins: [],
};
