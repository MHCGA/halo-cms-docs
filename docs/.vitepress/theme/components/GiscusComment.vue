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
import { computed } from "vue";
import { useData } from "vitepress";
import Giscus from "@giscus/vue";

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
  'en/': 'en',
  // 将来可以添加更多语言，如 'ja/': 'ja', 'fr/': 'fr'
};

const lang = computed(() => {
  const path = page.value.relativePath || '';
  const prefix = path.split('/')[0];
  const langPrefix = prefix ? `${prefix}/` : '';
  return pathToLang[langPrefix] || 'zh-CN';
});

const shouldShow = computed(() => {
  // 只在文章页面显示，不在首页等显示
  return page.value.relativePath?.startsWith("posts/") ?? false;
});
</script>

<style scoped>
.giscus-wrapper {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 2rem;
  padding-top: 2rem;
}
</style>