import type { LoaderModule } from "vitepress";

import { createCategoryLoader } from "../../.vitepress/data/category-loader.ts";
import type { CategoryPostMeta } from "../../.vitepress/data/category-loader.ts";

const postsData: LoaderModule<CategoryPostMeta[]> = createCategoryLoader("posts/plugins/*.md", "/posts/plugins/");

declare const data: CategoryPostMeta[];
export { data };
export default postsData;
