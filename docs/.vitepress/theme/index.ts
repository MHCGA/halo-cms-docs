// https://vitepress.dev/guide/custom-theme
import {
  NolebaseEnhancedReadabilitiesMenu,
  NolebaseEnhancedReadabilitiesScreenMenu,
} from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";

import GiscusComment from "./components/GiscusComment.vue";
import PageFooterNotice from "./components/PageFooterNotice.vue";
import PostMetadata from "./components/PostMetadata.vue";

import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import "./style.css";

import { NolebaseHighlightTargetedHeading } from "@nolebase/vitepress-plugin-highlight-targeted-heading/client";

import "@nolebase/vitepress-plugin-highlight-targeted-heading/client/style.css";

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
      // 为较宽的屏幕的导航栏添加阅读增强菜单
      "nav-bar-content-after": () => [h(NolebaseEnhancedReadabilitiesMenu)],
      // 为较窄的屏幕（通常是小于 iPad Mini）添加阅读增强菜单
      "nav-screen-content-after": () => [h(NolebaseEnhancedReadabilitiesScreenMenu)],
      // 闪烁高亮当前的目标标题
      "layout-top": () => [h(NolebaseHighlightTargetedHeading)],
    });
  },
} satisfies Theme;
