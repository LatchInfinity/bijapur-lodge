/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        lodge: {
          ink: "#11100d",
          charcoal: "#191815",
          stone: "#d8d1c3",
          moss: "#66715b",
          ember: "#c95335",
          linen: "#f4efe5",
          gold: "#B48F30",
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        header: "0 18px 60px rgba(17, 16, 13, 0.2)",
      },
    },
  },
  plugins: [],
};
