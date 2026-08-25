import { generateSW } from "workbox-build";

const result = await generateSW({
  globDirectory: "dist",
  swDest: "dist/service-worker.js",
  globPatterns: [
    "_expo/static/**/*.{js,css,wasm,woff,woff2}",
    "assets/**/*.{png,svg,woff,woff2,ttf,wasm}",
    "assets/__node_modules/.bun/**/*.{ttf,wasm}",
    "icons/*.png",
    "manifest.webmanifest",
    "favicon.ico"
  ],
  globIgnores: ["**/*.html"],
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: false,
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "zekraneh-pages-v1",
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }
      }
    },
    {
      urlPattern: ({ request }) => ["font", "style", "script", "worker"].includes(request.destination),
      handler: "StaleWhileRevalidate",
      options: { cacheName: "zekraneh-assets-v1" }
    }
  ]
});

console.log(`PWA آماده شد: ${result.count} فایل، ${result.size} بایت precache`);
