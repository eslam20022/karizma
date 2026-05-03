/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 🚀 السطر ده هو "قفل الأمان" اللي هيمنع الألوان الغامقة إنها تظهر لوحدها
  darkMode: 'class', 
  theme: {
    extend: {
      colors: {
        // الخلفية الرئيسية 
        'neo-bg': '#FBF9F6', 
        'neo-text': '#3D3D3D', 
        
        // 🤎 ألوان البراند الفخمة
        'brand-brown': '#5C4033', // البني الدافئ الأساسي
        'brand-sand': '#D4A373',  // الرملي للـ Hover والتفاصيل
      },
      boxShadow: {
        // ظلال ناعمة (Flat Design)
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 30px -5px rgba(92, 64, 51, 0.1)',
      },
      fontFamily: {
        sans: ['Tajawal', 'sans-serif'], 
      }
    },
  },
  plugins: [],
}