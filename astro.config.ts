import { unified } from "@astrojs/markdown-remark";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import rehypeFigure from "@microflash/rehype-figure";
import remarkFigure from "@microflash/remark-figure-caption";
import type { AstroIntegration } from "astro";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { typst } from "astro-typst";
import { defineConfig } from "astro/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { SITE } from "./src/config";

function notionAssetsIntegration(): AstroIntegration {
  const cacheDir = path.resolve(process.cwd(), ".astro/notion-assets");
  return {
    name: "notion-assets-integration",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith("/notion-assets/")) {
            const fileName = path.basename(req.url.split("?")[0]);
            const filePath = path.join(cacheDir, fileName);
            if (fs.existsSync(filePath)) {
              res.setHeader("Content-Type", "image/jpeg");
              res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
              return fs.createReadStream(filePath).pipe(res);
            }
          }
          next();
        });
      },
      "astro:build:done": ({ dir }) => {
        if (fs.existsSync(cacheDir)) {
          const outDir = path.join(fileURLToPath(dir), "notion-assets");
          fs.cpSync(cacheDir, outDir, { recursive: true });
        }
      },
    },
  };
}

export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react(),
    sitemap(),
    expressiveCode({
      themes: ["one-light", "catppuccin-frappe"],
      themeCssSelector: theme => {
        return `[data-theme='${theme.name === "one-light" ? "light" : "dark"}']`;
      },
      plugins: [pluginCollapsibleSections()],
    }),
    mdx(),
    typst({ options: { remPx: 14 }, target: "svg" }),
    icon({ iconDir: "src/assets/icons" }),
    notionAssetsIntegration(),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        remarkGfm,
        [remarkToc, { heading: "目录" }],
        [remarkFigure, { captionClassName: "text-center" }],
      ],
      rehypePlugins: [rehypeKatex, rehypeFigure],
    }),
  },
  vite: {
    server: {
      cors: true,
    },
    build: {
      rollupOptions: {
        // @ts-ignore - Rolldown / Vite 7+ diagnostic checks option
        checks: {
          preferBuiltinFeature: false,
        },
      },
    },
    ssr: {
      external: ["@myriaddreamin/typst-ts-node-compiler"],
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js", "katex"],
    },
  },
  scopedStyleStrategy: "where",
  security: {
    allowedDomains: [{ hostname: "giscus.app" }],
  },
});
