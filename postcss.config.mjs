const isVitest = !!process.env.VITEST;

const config = {
  // In tests, avoid loading Tailwind/PostCSS plugin to prevent Vitest startup errors
  plugins: isVitest ? [] : { "@tailwindcss/postcss": {} },
};

export default config;
