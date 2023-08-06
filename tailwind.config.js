/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ["class"],
  safelist: [
    'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-screen-sm', 'max-w-screen-md', 'max-w-screen-lg', 'max-w-screen-xl',
    'text-sm', 'text-md', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl', 
    'opacity-0', 'opacity-5', 'opacity-10', 'opacity-20', 'opacity-25', 'opacity-30', 'opacity-40', 'opacity-50', 'opacity-60', 'opacity-70', 'opacity-75', 'opacity-80', 'opacity-90', 'opacity-95', 'opacity-100'
  ],
  theme: {
    extend: {
      colors: {
        "oslyn": {
          50:  '#e7ddff',
          100: '#d7c5ff',
          200: '#bb9bff',
          300: '#a275ff',
          400: '#8c54ff',
          500: '#7837ff',
          600: '#651fff',
          700: '#5f28d4',
          800: '#47258c',
          900: '#2a1a4a',
        },
        "coral": {
          50:  '#e4bcbb',
          100: '#ecafac',
          200: '#f4a194',
          300: '#fa957c',
          400: '#ff8a65',
          500: '#ef9764',
          600: '#d79961',
          700: '#a98453',
          800: '#594b30',
          900: '#12100b',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
