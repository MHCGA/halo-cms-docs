// https://vitepress.dev/guide/custom-theme
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";

import GiscusComment from "./components/GiscusComment.vue";
import PageFooterNotice from "./components/PageFooterNotice.vue";
import PostMetadata from "./components/PostMetadata.vue";

import "./style.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "doc-footer-before": () => [h(PostMetadata), h(PageFooterNotice)],
      "doc-after": () =>
        h(GiscusComment, {
          repo: "MHCGA/halo-cms-docs",
          repoId: "R_kgDOQgjPtQ",
          category: "Announcements",
          categoryId: "DIC_kwDOQgjPtc4CzQs-",
        }),
    });
  },
} satisfies Theme;
