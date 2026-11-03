import { SITE } from "@config";
import notionClientPkg from "@notionhq/client";
import type { Loader, LoaderContext } from "astro/loaders";
import n2mPkg from "notion-to-md";
import { slugifyStr } from "./slugify";

const { Client } = notionClientPkg;
const { NotionToMarkdown } = n2mPkg;

export interface NotionLoaderOptions {
  auth?: string;
  databaseId?: string;
}

interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
}

interface NotionQueryResult {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

function extractPlainText(richTextList: unknown): string {
  if (!Array.isArray(richTextList)) return "";
  return richTextList
    .map(
      item => (typeof item === "object" && item && "plain_text" in item && typeof item.plain_text === "string"
        ? item.plain_text
        : ""),
    )
    .join("")
    .trim();
}

function extractPropertyValue(prop: unknown): unknown {
  if (!prop || typeof prop !== "object" || !("type" in prop)) return undefined;
  const typedProp = prop as Record<string, unknown>;

  switch (typedProp.type) {
    case "title":
      return extractPlainText(typedProp.title);
    case "rich_text":
      return extractPlainText(typedProp.rich_text);
    case "date": {
      const dateObj = typedProp.date;
      if (dateObj && typeof dateObj === "object" && "start" in dateObj && typeof dateObj.start === "string") {
        return new Date(dateObj.start);
      }
      return undefined;
    }
    case "created_time":
      return typeof typedProp.created_time === "string" ? new Date(typedProp.created_time) : undefined;
    case "last_edited_time":
      return typeof typedProp.last_edited_time === "string" ? new Date(typedProp.last_edited_time) : undefined;
    case "multi_select":
      return Array.isArray(typedProp.multi_select)
        ? typedProp.multi_select
          .map(
            item => (typeof item === "object" && item && "name" in item && typeof item.name === "string"
              ? item.name
              : undefined),
          )
          .filter((name): name is string => Boolean(name))
        : [];
    case "select": {
      const selectObj = typedProp.select;
      if (selectObj && typeof selectObj === "object" && "name" in selectObj && typeof selectObj.name === "string") {
        return selectObj.name;
      }
      return undefined;
    }
    case "checkbox":
      return Boolean(typedProp.checkbox);
    case "files":
      if (Array.isArray(typedProp.files) && typedProp.files.length > 0) {
        const file = typedProp.files[0];
        if (file && typeof file === "object") {
          if (
            "file" in file && file.file && typeof file.file === "object" && "url" in file.file
            && typeof file.file.url === "string"
          ) {
            return file.file.url;
          }
          if (
            "external" in file && file.external && typeof file.external === "object" && "url" in file.external
            && typeof file.external.url === "string"
          ) {
            return file.external.url;
          }
        }
      }
      return undefined;
    case "url":
      return typeof typedProp.url === "string" ? typedProp.url : undefined;
    default:
      return undefined;
  }
}

async function resolveDataSourceId(client: InstanceType<typeof Client>, databaseId: string): Promise<string> {
  try {
    const db = (await client.databases.retrieve({ database_id: databaseId })) as unknown as {
      data_sources?: Array<{ id: string }>;
    };
    if (Array.isArray(db.data_sources) && db.data_sources.length > 0 && db.data_sources[0].id) {
      return db.data_sources[0].id;
    }
  } catch {
  }
  return databaseId;
}

async function fetchNotionPages(client: InstanceType<typeof Client>, targetId: string): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | null = null;
  const dataSourceId = await resolveDataSourceId(client, targetId);

  do {
    let response: NotionQueryResult;
    try {
      response = (await client.dataSources.query({
        data_source_id: dataSourceId,
        ...(cursor ? { start_cursor: cursor } : {}),
      })) as unknown as NotionQueryResult;
    } catch {
      response = (await client.request({
        path: `databases/${targetId}/query`,
        method: "post",
        body: cursor ? { start_cursor: cursor } : {},
      })) as unknown as NotionQueryResult;
    }

    if (Array.isArray(response.results)) {
      for (const item of response.results) {
        if (item && typeof item === "object" && "properties" in item && "id" in item) {
          pages.push(item);
        }
      }
    }

    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);

  return pages;
}

export function notionLoader(options: NotionLoaderOptions = {}): Loader {
  const auth = options.auth || process.env.NOTION_TOKEN;
  const databaseId = options.databaseId || process.env.NOTION_DATABASE_ID;

  return {
    name: "notion-loader",
    load: async (context: LoaderContext): Promise<void> => {
      if (!auth || !databaseId) {
        context.logger.info(
          "Notion credentials not set (NOTION_TOKEN or NOTION_DATABASE_ID missing). Skipping Notion loader.",
        );
        return;
      }

      const notion = new Client({ auth });
      const n2m = new NotionToMarkdown({ notionClient: notion });

      try {
        const pages = await fetchNotionPages(notion, databaseId);

        for (const page of pages) {
          const props = page.properties;

          const getProp = (name: string) => {
            const key = Object.keys(props).find(k => k.toLowerCase() === name.toLowerCase());
            return key ? props[key] : undefined;
          };

          const rawTitle = (extractPropertyValue(getProp("title")) as string) || "Untitled";
          const rawSlug = extractPropertyValue(getProp("slug"));
          const id = (rawSlug && String(rawSlug).trim())
            ? slugifyStr(String(rawSlug).trim())
            : slugifyStr(rawTitle) || page.id;

          const lastEditedTime = page.last_edited_time;
          const existing = context.store.get(id);

          if (existing && existing.digest === lastEditedTime) {
            continue;
          }

          const rawDesc = extractPropertyValue(getProp("description")) as string | undefined;
          const rawDate = extractPropertyValue(getProp("date")) as Date | undefined;
          const rawUpdated = extractPropertyValue(getProp("updated")) as Date | undefined;
          const rawTags = extractPropertyValue(getProp("tags")) as string[] | undefined;
          const rawDraft = extractPropertyValue(getProp("draft")) as boolean | undefined;
          const rawFeatured = extractPropertyValue(getProp("featured")) as boolean | undefined;
          const rawAuthor = extractPropertyValue(getProp("author")) as string | undefined;
          const rawOgImage = extractPropertyValue(getProp("ogimage")) as string | undefined;

          const mdBlocks = await n2m.pageToMarkdown(page.id);
          const mdString = n2m.toMarkdownString(mdBlocks).parent;

          let description = rawDesc;
          if (!description) {
            const cleanText = mdString.replace(/[#*`_~[\]()>\n\r]/g, " ").replace(/\s+/g, " ").trim();
            description = cleanText.slice(0, 150) || rawTitle;
          }

          const pubDatetime = rawDate ? new Date(rawDate) : new Date(page.created_time);
          const modDatetime = rawUpdated
            ? new Date(rawUpdated)
            : (lastEditedTime ? new Date(lastEditedTime) : undefined);
          const tags = Array.isArray(rawTags) && rawTags.length > 0 ? rawTags : ["others"];
          const draft = typeof rawDraft === "boolean" ? rawDraft : false;
          const featured = typeof rawFeatured === "boolean" ? rawFeatured : false;
          const author = rawAuthor || SITE.author;

          const rendered = await context.renderMarkdown(mdString);

          context.store.set({
            id,
            data: {
              title: rawTitle,
              description,
              pubDatetime,
              modDatetime,
              author,
              tags,
              draft,
              featured,
              ...(rawOgImage ? { ogImage: rawOgImage } : {}),
            },
            body: mdString,
            rendered,
            digest: lastEditedTime,
          });
        }
      } catch (error) {
        context.logger.error(
          `Error loading Notion database ${databaseId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  };
}
