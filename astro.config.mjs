import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const siteURL = process.env.SITE_URL?.trim();
const site = siteURL ? new URL(siteURL) : undefined;

function manusStorageProxy() {
  return {
    name: "manus-storage-proxy",
    configureServer(server) {
      server.middlewares.use("/manus-storage", async (req, res) => {
        const key = req.url?.replace(/^\//, "");
        const forgeBaseUrl = (process.env.BUILT_IN_FORGE_API_URL || "").replace(/\/+$/, "");
        const forgeKey = process.env.BUILT_IN_FORGE_API_KEY || "";

        if (!key || !forgeBaseUrl || !forgeKey) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Media unavailable");
          return;
        }

        try {
          const presign = new URL("v1/storage/presign/get", `${forgeBaseUrl}/`);
          presign.searchParams.set("path", key);
          const presignResponse = await fetch(presign, {
            headers: { Authorization: `Bearer ${forgeKey}` },
          });
          if (!presignResponse.ok) throw new Error("presign failed");
          const { url } = await presignResponse.json();
          const mediaResponse = await fetch(url);
          if (!mediaResponse.ok) throw new Error("media fetch failed");
          res.writeHead(200, {
            "Content-Type": mediaResponse.headers.get("content-type") || "application/octet-stream",
            "Cache-Control": "public, max-age=86400",
          });
          res.end(Buffer.from(await mediaResponse.arrayBuffer()));
        } catch {
          res.writeHead(502, { "Content-Type": "text/plain" });
          res.end("Media unavailable");
        }
      });
    },
  };
}

export default defineConfig({
  site,
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss(), manusStorageProxy()],
  },
});
