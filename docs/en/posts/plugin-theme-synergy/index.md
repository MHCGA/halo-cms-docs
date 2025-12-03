---
publish: false
---

# Plugin & Theme Synergy

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
import { withBase } from "vitepress";
</script>

Guides and case studies showing how plugins and themes work together to create cohesive Halo CMS experiences.

## Article List

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="withBase(post.url)">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">({{ post.lastUpdated }})</span>
 </li>
</ul>
