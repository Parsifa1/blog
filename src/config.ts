import { type GiscusProps } from "@giscus/react";
import type { Site } from "./types";

export const SITE: Site = {
  website: "https://blog.cloudti.de", // replace this with your deployed domain
  author: "Parsifal",
  desc: "Parsifa1's Blog",
  title: "Parsifal's Blog",
  ogImage: "https://i2.woh.to/2023/09/30/photo_2023-05-07_23-49-04a122368bf889ed18.jpg",
  lightAndDarkMode: true,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
};

export const LOCALE = {
  lang: "zh-CN", // html lang code. Set this empty and default will be "en"
  langTag: ["zh-CN"], // BCP 47 Language Tags. Set this empty [] to use the environment default
} as const;

export const LOGO_IMAGE = {
  enable: false,
  svg: true,
  width: 50,
  height: 50,
};

export const GISCUS: GiscusProps = {
  repo: "parsifa1/blog",
  repoId: "R_kgDOK8DWdg",
  category: "Announcements",
  categoryId: "DIC_kwDOK8DWds4CjYyb",
  mapping: "pathname",
  reactionsEnabled: "1",
  emitMetadata: "0",
  inputPosition: "top",
  lang: "zh-CN",
  loading: "lazy",
};

export const SOCIALS = [
  {
    name: "Github",
    href: "https://github.com/Parsifa1",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "Mail",
    href: "li.aldric@gmail.com",
    linkTitle: `Send an email to ${SITE.title}`,
    active: false,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/Aldric_li",
    linkTitle: `${SITE.title} on Twitter`,
    active: false,
  },
  {
    name: "Steam",
    href: "https://github.com/satnaing/astro-paper",
    linkTitle: `${SITE.title} on Steam`,
    active: false,
  },
  {
    name: "Telegram",
    href: "https://t.me/c1oudtide",
    linkTitle: `${SITE.title} on Telegram`,
    active: true,
  },
];
