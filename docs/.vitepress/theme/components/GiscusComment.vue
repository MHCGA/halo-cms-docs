<template>
  <div v-if="shouldShow" class="giscus-wrapper">
    <Giscus
      :repo="repo"
      :repo-id="repoId"
      :category="category"
      :category-id="categoryId"
      :mapping="mapping"
      :term="term"
      :strict="strict"
      :reactions-enabled="reactionsEnabled"
      :emit-metadata="emitMetadata"
      :input-position="inputPosition"
      :theme="theme"
      :lang="lang"
      :loading="loading"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import Giscus from "@giscus/vue";
import { useData } from "vitepress";
import { computed } from "vue";

interface Props {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  mapping?: string;
  term?: string;
  strict?: boolean;
  reactionsEnabled?: boolean;
  emitMetadata?: boolean;
  inputPosition?: string;
  theme?: string;
  lang?: string;
  loading?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mapping: "pathname",
  strict: true,
  reactionsEnabled: true,
  emitMetadata: false,
  inputPosition: "top",
  theme: "preferred_color_scheme",
  lang: "zh-CN",
  loading: "lazy",
});

const { page } = useData();

// 路径前缀到 Giscus 语言代码的映射
const pathToLang: Record<string, string> = {
  root: "zh-CN",
  en: "en",
};

const lang = computed(() => {
  const path = page.value.relativePath || "";
  let rt = pathToLang["root"]; // 默认语言
  for (const [prefix, langCode] of Object.entries(pathToLang)) {
    if (prefix !== "root" && path.startsWith(`${prefix}/`)) {
      rt = langCode;
      break;
    }
  }
  return rt;
});

const shouldShow = computed(() => {
  // 不在 publish: false 页面显示
  return page.value?.frontmatter?.publish !== false;
});
</script>

<style scoped>
.giscus-wrapper {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
  padding-top: 2rem;
}
</style>
