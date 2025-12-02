import { defineConfig } from "vitepress";
import { chineseSearchOptimize, pagefindPlugin } from "vitepress-plugin-pagefind";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [
      // Pagefind search plugin
      pagefindPlugin({
        customSearchQuery: chineseSearchOptimize,
        showDate: (date: number, lang: string) => {
          const now = Date.now();
          const diff = date - now; // 正值表示未来，负值表示过去
          const sign = Math.sign(diff);
          const absDiff = Math.abs(diff);

          const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

          // 时间单位及其对应的毫秒数
          if (absDiff < 60000) {
            // 小于 1 分钟
            const timeDiff = sign * Math.floor(absDiff / 1000);
            return rtf.format(timeDiff, "second");
          } else if (absDiff < 3600000) {
            // 小于 1 小时
            const timeDiff = sign * Math.floor(absDiff / 60000);
            return rtf.format(timeDiff, "minute");
          } else if (absDiff < 86400000) {
            // 小于 1 天
            const timeDiff = sign * Math.floor(absDiff / 3600000);
            return rtf.format(timeDiff, "hour");
          } else if (absDiff < 604800000) {
            // 小于 1 周
            const timeDiff = sign * Math.floor(absDiff / 86400000);
            return rtf.format(timeDiff, "day");
          } else if (absDiff < 2592000000) {
            // 小于 30 天
            const timeDiff = sign * Math.floor(absDiff / 604800000);
            return rtf.format(timeDiff, "week");
          } else if (absDiff < 31536000000) {
            // 小于 365 天
            const timeDiff = sign * Math.floor(absDiff / 2592000000);
            return rtf.format(timeDiff, "month");
          } else {
            // 默认按年为单位
            const timeDiff = sign * Math.floor(absDiff / 31536000000);
            return rtf.format(timeDiff, "year");
          }
        },
        locales: {
          root: {
            btnPlaceholder: "搜索",
            placeholder: "搜索文档",
            emptyText: "空空如也",
            heading: "共 {{searchResult}} 条结果",
            toSelect: "选择",
            toNavigate: "切换",
            toClose: "关闭",
            searchBy: "搜索提供者",
          },
          en: {
            btnPlaceholder: "Search",
            placeholder: "Search Docs...",
            emptyText: "No results",
            heading: "Total {{searchResult}} results",
            showDate: true,
          },
        },
      }),
    ],
  },
  title: "Make Halo CMS Great Again",
  description: "Share tips related to Halo CMS.",

  head: [
    ["link", { rel: "icon", type: "image/x-icon", href: "/mhcga/ico.ico" }],
    ["meta", { name: "theme-color", content: "#5f67ee" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Make Halo CMS Great Again" }],
    [
      "meta",
      {
        property: "og:image",
        content: "https://howiehz.top/mhcga/ico.ico",
      },
    ],
    ["meta", { property: "og:url", content: "https://howiehz.top/mhcga/" }],
    // <script defer src="https://umami.howiehz.top/script.js" data-website-id="7b461ac5-155d-45a8-a118-178d0a2936e4" data-domains="howiehz.top"></script>
    [
      "script",
      {
        defer: "",
        src: "https://umami.howiehz.top/script.js",
        "data-website-id": "7b461ac5-155d-45a8-a118-178d0a2936e4",
        "data-domains": "howiehz.top",
      },
    ],
  ],

  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  locales: {
    root: {
      label: "简体中文",
      lang: "zh-Hans",
      dir: "ltr",
    },
    en: {
      label: "English",
      lang: "en-US",
      dir: "ltr",
    },
  },

  sitemap: {
    hostname: "https://howiehz.top/mhcga/",
    xmlns: {
      // trim the xml namespace
      news: true, // flip to false to omit the xml namespace for news
      xhtml: true,
      image: true,
      video: true,
      custom: [
        'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"',
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      ],
    },
  },

  markdown: {
    container: {
      tipLabel: "提示",
      warningLabel: "警告",
      dangerLabel: "危险",
      infoLabel: "信息",
      detailsLabel: "详细信息",
    },
    image: {
      lazyLoading: true,
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: { src: "/ico.ico", width: 24, height: 24 },

    socialLinks: [{ icon: "github", link: "https://github.com/MHCGA/blog" }],

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    footer: {
      message: "基于 MIT 许可发布",
      copyright: "版权所有 © 2025-至今 MHCGA",
    },

    editLink: {
      pattern: "https://github.com/MHCGA/blog/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页面",
    },

    outline: {
      label: "本页大纲",
    },

    lastUpdated: {
      text: "最后更新于",
    },

    notFound: {
      title: "页面未找到",
      quote: "但如果你不改变方向，并且继续寻找，你可能最终会到达你所前往的地方。",
      linkLabel: "前往首页",
      linkText: "带我回首页",
    },

    langMenuLabel: "多语言",
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
    skipToContentLabel: "跳转到内容",

    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/MHCGA" }],
  },
});
