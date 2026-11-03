import "dotenv/config";
import { SITE } from "@config";
import { glob } from "astro/loaders";
import type { Loader, LoaderContext } from "astro/loaders";
import { defineCollection, z } from "astro:content";
import { notionLoader } from "./utils/notionLoader";

function compositeLoader(loaders: Loader[]): Loader {
  return {
    name: "composite-loader",
    load: async (context: LoaderContext): Promise<void> => {
      for (const loader of loaders) {
        await loader.load(context);
      }
    },
  };
}

const localLoader = glob({ pattern: ["**.md", "**.mdx", "**.typ"], base: "./src/content" });
const loaders: Loader[] = [localLoader];
if (process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID) {
  loaders.push(notionLoader());
}
const blog = defineCollection({
  loader: loaders.length > 1 ? compositeLoader(loaders) : localLoader,
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDatetime: z.date().or(z.string()),
      author: z.string().default(SITE.author),
      modDatetime: z.date().optional().nullable(),
      canonicalURL: z.string().optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image()
        .refine(img => img.width >= 1200 && img.height >= 630, {
          message: "OpenGraph image must be at least 1200 X 630 pixels!",
        })
        .or(z.string())
        .optional(),
      annotations: z
        .array(
          z.object({
            id: z.string(),
            index: z.number(),
            author: z.string().optional(),
            time: z.string(),
            content: z.string(),
          }),
        )
        .optional(),
    }),
});
export const collections = { blog };
