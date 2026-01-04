import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import rehypeFigure from "@microflash/rehype-figure";
import remarkFigure from "@microflash/remark-figure-caption";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import { typst } from "astro-typst";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import { SITE } from "./src/config";
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
  ],
  markdown: {
    remarkPlugins: [remarkMath, remarkGfm, [remarkToc, { heading: "目录" }], [remarkFigure, {
      captionClassName: "text-center",
    }]],
    rehypePlugins: [rehypeKatex, rehypeFigure],
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
