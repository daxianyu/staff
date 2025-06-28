const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      features: {
        "custom-properties": false
      },
      autoprefixer: {
        flexbox: "no-2009",
        grid: "autoplace"
      }
    }
  }
};

export default config;
