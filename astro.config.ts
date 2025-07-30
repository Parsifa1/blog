import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import remarkFigure from "@microflash/remark-figure-caption";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
// import remarkCollapse from "remark-collapse";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
// eslint-disable-next-line default
import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";
import icon from "astro-icon";
import { typst } from "astro-typst";
import { SITE } from "./src/config";
export default defineConfig({
  site: SITE.website,
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
    sitemap(),
    mdx(),
    typst({
      options: {
        remPx: 14,
      },
      target: (id: string) => {
        console.debug(`Detecting ${id}`);
        if (id.endsWith(".html.typ")) {
          return "html";
        }
        return "svg";
      },
    }),
    icon({
      iconDir: "src/assets/icons",
    }),
    sentry(),
    spotlightjs(),
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkGfm, [remarkToc, { heading: "目录" }], [remarkFigure, {
      captionClassName: "text-center",
    }]],
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
      exclude: ["@resvg/resvg-js", "katex"],
    },
  },
  scopedStyleStrategy: "where",
});
