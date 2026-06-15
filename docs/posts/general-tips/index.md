---
publish: false
---

# 通用开发技巧

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

收录不限定于插件、主题或站点使用场景的 Halo CMS 通用实践。

## 文章标题一览

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">（{{ post.lastUpdated }}）</span>
 </li>
</ul>
