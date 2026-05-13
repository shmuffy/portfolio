import { defineConfig } from "vite";

// `base: './'` makes asset URLs relative, so the built site works both at a
// domain root (e.g. christiankim.dev) and at a user GitHub Pages site
// (username.github.io). If you deploy to a *project* page
// (username.github.io/portfolio), change this to '/portfolio/'.
export default defineConfig({
  base: "./",
  build: {
    target: "es2022",
    cssMinify: true,
  },
});
