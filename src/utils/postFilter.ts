import type { CollectionEntry } from "astro:content";

const postFilter = ({ data }: CollectionEntry<"blog">) => {
  // const isPublishTimePassed =
  //   Date.now() >
  //   new Date(data.pubDatetime).getTime() - SITE.scheduledPostMargin;
  // return !data.draft && (import.meta.env.DEV || isPublishTimePassed);
  return !data.draft;
};

export default postFilter;
