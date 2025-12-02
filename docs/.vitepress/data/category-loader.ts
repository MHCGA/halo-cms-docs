import { createContentLoader } from "vitepress";

import { formatDateToYMD } from "../utils/formatDate";

export interface CategoryPostMeta {
  title: string;
  url: string;
  lastUpdated?: string;
}

interface LoaderOptions {
  sort?: (a: CategoryPostMeta, b: CategoryPostMeta) => number;
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

export function createCategoryLoader(globPattern: string, baseUrl: string, options: LoaderOptions = {}) {
  return createContentLoader(globPattern, {
    excerpt: false,
    transform(items) {
      const posts: CategoryPostMeta[] = items
        .filter((item) => normalizeUrl(item.url) !== normalizeUrl(baseUrl))
        .map((item) => {
          const { frontmatter = {}, url } = item;
          const title = frontmatter.title || item.title || inferTitleFromUrl(url);
          const rawDate = item.lastUpdated;
          const lastUpdated = formatDateToYMD(rawDate) || rawDate;
          return { title, url, lastUpdated };
        });

      const sorted = options.sort ? [...posts].sort(options.sort) : posts.sort(sortByDateDesc);
      return sorted;
    },
  });
}

function inferTitleFromUrl(url: string): string {
  const slug = url.replace(/\/$/, "").split("/").filter(Boolean).pop() || url;
  return slug.replace(/-/g, " ");
}

function sortByDateDesc(a: CategoryPostMeta, b: CategoryPostMeta): number {
  const aDate = a.lastUpdated ? Date.parse(a.lastUpdated) : 0;
  const bDate = b.lastUpdated ? Date.parse(b.lastUpdated) : 0;
  return bDate - aDate;
}
