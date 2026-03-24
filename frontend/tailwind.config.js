/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0f172a",
        panel: "#111827",
        border: "#1e293b",
        accent: "#2dd4bf",
        highlight: "#fb923c",
        ink: "#020617",
      },
      boxShadow: {
        soft: "0 20px 50px rgba(2, 6, 23, 0.35)",
      },
    },
  },
  plugins: [],
};
