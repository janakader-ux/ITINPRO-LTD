/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0A1128',
        navy: '#0B132B',
        card: '#1C2541',
        gold: '#D4AF37',
        amberGold: '#E2B659',
        silver: '#A0AEC0',
        emerald: '#10B981'
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        display: ['var(--font-playfair)', 'Playfair Display', 'serif']
      },
      boxShadow: {
        gold: '0 18px 60px rgba(212, 175, 55, 0.16)',
        glass: '0 24px 80px rgba(0, 0, 0, 0.28)'
      },
      backgroundImage: {
        'gold-sheen': 'linear-gradient(135deg, #E2B659 0%, #D4AF37 48%, #F3D98B 100%)'
      }
    }
  },
  plugins: []
};
