import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
const site = process.env.SITE_URL?.trim() || "https://terbalikpenang.com";
export default defineConfig({site, integrations:[sitemap({filter:(page)=>!page.endsWith("/404/")})],vite:{plugins:[tailwindcss()]}});
