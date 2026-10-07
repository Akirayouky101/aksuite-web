/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './platforms/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ak: {
          text: '#eff9ff',
          muted: '#cfdeef',
          subtle: '#9db8d2',
          panel: '#152841',
          inset: '#102139',
          hover: '#23415e',
          line: '#365774',
          accent: '#1966a5',
          'accent-hover': '#1c74b5',
          cyan: '#83cfff',
          success: '#8bd6b5',
          'success-bg': '#153b35',
          warning: '#efce83',
          'warning-bg': '#3d321d',
          danger: '#ffaaa3',
          'danger-bg': '#42232d',
          purple: '#ceb8f3',
          'purple-bg': '#302c4b',
          pink: '#edb3d0',
          'pink-bg': '#422c40',
          orange: '#efbc8a',
          'orange-bg': '#3d2e23',
        },
      },
    },
  },
  plugins: [],
}
