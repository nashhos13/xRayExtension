module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({
      config: './tailwind.config.js', // optional if you're using the default name
    }),
    require('autoprefixer'),
  ],
}
