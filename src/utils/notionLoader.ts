import { SITE } from "@config";
import notionClientPkg from "@notionhq/client";
import type { Loader, LoaderContext } from "astro/loaders";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
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

      n2m.setCustomTransformer("image", async (block: unknown) => {
        if (!block || typeof block !== "object") return "";
        const imageBlock = block as Record<string, unknown>;
        const image = (imageBlock.image && typeof imageBlock.image === "object")
          ? (imageBlock.image as Record<string, unknown>)
          : undefined;
        if (!image) return "";

        const captionText = Array.isArray(image.caption)
          ? extractPlainText(image.caption)
          : "";

        let sourceUrl = "";
        const imgObj = image as { external?: { url?: string }; file?: { url?: string } };
        if (image.type === "external") {
          sourceUrl = imgObj.external?.url || "";
        } else if (image.type === "file") {
          sourceUrl = imgObj.file?.url || "";
        }

        if (!sourceUrl) return "";

        let finalUrl = sourceUrl;
        if (image.type === "file") {
          try {
            const assetsDir = path.resolve(process.cwd(), ".astro/notion-assets");
            if (!fs.existsSync(assetsDir)) {
              fs.mkdirSync(assetsDir, { recursive: true });
            }
            const blockId = typeof imageBlock.id === "string" ? imageBlock.id : sourceUrl;
            const hash = createHash("md5").update(blockId).digest("hex").slice(0, 12);
            let ext = ".jpg";
            const cleanUrl = sourceUrl.split("?")[0];
            const parsedExt = path.extname(cleanUrl);
            if (parsedExt && parsedExt.length <= 5) {
              ext = parsedExt;
            }
            const fileName = `${hash}${ext}`;
            const localFilePath = path.join(assetsDir, fileName);

            if (!fs.existsSync(localFilePath)) {
              const res = await fetch(sourceUrl);
              if (res.ok) {
                const buffer = Buffer.from(await res.arrayBuffer());
                fs.writeFileSync(localFilePath, buffer);
              }
            }
            finalUrl = `/notion-assets/${fileName}`;
          } catch (err) {
            context.logger.warn(`Failed to cache Notion image: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        let explicitWidth = "";
        let cleanCaption = captionText;

        const sizeMatch = captionText.match(/\|(?:w=)?(\d+(?:px|%)?)\s*$/i)
          || captionText.match(/\b(?:width|w)=(\d+(?:px|%)?)\b/i);
        if (sizeMatch) {
          explicitWidth = sizeMatch[1];
          if (!explicitWidth.endsWith("%") && !explicitWidth.endsWith("px")) {
            explicitWidth += "px";
          }
          cleanCaption = captionText
            .replace(/\|(?:w=)?(\d+(?:px|%)?)\s*$/i, "")
            .replace(/\b(?:width|w)=(\d+(?:px|%)?)\b/i, "")
            .trim();
        }

        if (explicitWidth) {
          const captionHtml = cleanCaption
            ? `<figcaption class="text-center">${cleanCaption}</figcaption>`
            : "";
          return `<figure class="flex flex-col items-center my-4"><img src="${finalUrl}" alt="${cleanCaption}" style="width: ${explicitWidth}; max-width: 100%; height: auto;" />${captionHtml}</figure>`;
        }

        return `![${cleanCaption}](${finalUrl})`;
      });
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
          const blockChildrenRes = await notion.blocks.children.list({ block_id: page.id });
          const annotations: Array<{
            id: string;
            index: number;
            author?: string;
            time: string;
            content: string;
          }> = [];

          let annotationIndex = 1;

          for (const rawBlock of blockChildrenRes.results) {
            const blockObj = rawBlock as Record<string, unknown>;
            const blockType = typeof blockObj.type === "string" ? blockObj.type : "";
            const typePayload = (blockType && typeof blockObj[blockType] === "object")
              ? (blockObj[blockType] as Record<string, unknown>)
              : undefined;

            if (!typePayload || !Array.isArray(typePayload.rich_text) || typePayload.rich_text.length === 0) {
              continue;
            }

            try {
              const commentRes = await notion.comments.list({ block_id: rawBlock.id });
              if (commentRes.results && commentRes.results.length > 0) {
                for (const comment of commentRes.results) {
                  const commentText = extractPlainText(comment.rich_text);
                  if (!commentText) continue;
                  const createdTime = new Date(comment.created_time);
                  const month = String(createdTime.getMonth() + 1).padStart(2, "0");
                  const day = String(createdTime.getDate()).padStart(2, "0");
                  const hours = String(createdTime.getHours()).padStart(2, "0");
                  const minutes = String(createdTime.getMinutes()).padStart(2, "0");
                  const timeStr = `${month}-${day} ${hours}:${minutes}`;

                  annotations.push({
                    id: comment.id,
                    index: annotationIndex,
                    author: (comment.display_name?.type === "user" && comment.display_name.resolved_name)
                      ? comment.display_name.resolved_name
                      : undefined,
                    time: timeStr,
                    content: commentText,
                  });

                  const anchorId = `note-${annotationIndex}`;
                  const markId = `mark-${annotationIndex}`;

                  const segments = typePayload.rich_text as Array<Record<string, unknown>>;
                  let targetSegmentIndex = 0;
                  if (segments.length === 3) {
                    targetSegmentIndex = 1;
                  } else if (segments.length > 1) {
                    let minLen = Infinity;
                    for (let i = 0; i < segments.length; i++) {
                      const text = String(segments[i].plain_text || "");
                      if (text.length > 0 && text.length < minLen && !text.includes("\n")) {
                        minLen = text.length;
                        targetSegmentIndex = i;
                      }
                    }
                  }

                  const targetSeg = segments[targetSegmentIndex];
                  const segText = (targetSeg.text && typeof targetSeg.text === "object")
                    ? (targetSeg.text as Record<string, unknown>)
                    : undefined;

                  const rawContent = String(segText?.content || targetSeg.plain_text || "");
                  const wrappedContent =
                    `<span class="annotated-text" id="${markId}" data-target="${anchorId}">${rawContent}<sup class="note-badge">[${annotationIndex}]</sup></span>`;

                  if (segText) {
                    segText.content = wrappedContent;
                  }
                  targetSeg.plain_text = wrappedContent;

                  annotationIndex++;
                }
              }
            } catch {
            }
          }

          const mdBlocks = await n2m.blocksToMarkdown(blockChildrenRes.results);
          for (const mdBlock of mdBlocks) {
            if (mdBlock.type !== "code" && mdBlock.parent) {
              mdBlock.parent = mdBlock.parent.replace(/([^\n])\n([^\n])/g, "$1  \n$2");
            }
          }
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
              annotations: annotations.length > 0 ? annotations : undefined,
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
