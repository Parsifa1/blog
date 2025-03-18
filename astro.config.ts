import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
// import remarkCollapse from "remark-collapse";
import { typst } from "astro-typst";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import icon from "astro-icon";
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
    typst(),
    mdx(),
    icon({
      iconDir: "src/assets/icons",
    }),
    sentry(),
    spotlightjs(),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkGfm,
      [remarkToc as any, { heading: "目录" }],
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
  },
  vite: {
    ssr: {
      external: ["@myriaddreamin/typst-ts-node-compiler"],
    },
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  experimental: {
    svg: true,
  },
  scopedStyleStrategy: "where",
});
