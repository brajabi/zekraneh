import path from "node:path";

const dist = path.resolve(process.cwd(), "dist");
const port = Number(process.env.ZEKRANEH_PREVIEW_PORT ?? 4173);
const headers = {
  "Cross-Origin-Embedder-Policy": "credentialless",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cache-Control": "no-cache",
};

Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes("..")) return new Response("Bad request", { status: 400, headers });
    const relative = pathname === "/" ? "index.html" : pathname.slice(1);
    const candidates = [relative, `${relative}.html`];
    for (const candidate of candidates) {
      const file = Bun.file(path.join(dist, candidate));
      if (await file.exists()) return new Response(file, { headers });
    }
    return new Response(Bun.file(path.join(dist, "+not-found.html")), { status: 404, headers });
  },
});

console.log(`ذکرانه روی http://127.0.0.1:${port} آماده تست است`);
