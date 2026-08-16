import type { LoaderModule } from "vitepress";

import { createCategoryLoader } from "../../.vitepress/data/category-loader.ts";
import type { CategoryPostMeta } from "../../.vitepress/data/category-loader.ts";

const postsData: LoaderModule<CategoryPostMeta[]> = createCategoryLoader("posts/themes/*.md", "/posts/themes/");

declare const data: CategoryPostMeta[];
export { data };
export default postsData;
