---
publish: false
---

# Theme Development Tips

<script setup lang="ts">
import { data as posts } from "./posts.data.ts";
</script>

Best practices for Halo CMS theme design, covering UX systems, component composition, and performance tuning.

## Article List

<ul class="category-post-list">
 <li v-for="post in posts" :key="post.url">
  <a :href="post.url">{{ post.title }}</a>
    <span v-if="post.lastUpdated" class="category-post-date">({{ post.lastUpdated }})</span>
 </li>
</ul>
