---
publish: false
---

# Miscellaneous Insights

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

Stories, tools, and research around the Halo CMS ecosystem that do not fit the other categories.

## Article List

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">({{ post.lastUpdated }})</span>
 </li>
</ul>
