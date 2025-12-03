---
publish: false
---

# Plugin Development Tips

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

A collection of practical notes for building Halo CMS plugins, from architecture to debugging and release automation.

## Article List

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">({{ post.lastUpdated }})</span>
 </li>
</ul>
