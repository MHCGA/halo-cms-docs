import type { LoaderModule } from "vitepress";

import { createCategoryLoader } from "../../../.vitepress/data/category-loader.ts";
import type { CategoryPostMeta } from "../../../.vitepress/data/category-loader.ts";

const postsData: LoaderModule<CategoryPostMeta[]> = createCategoryLoader("en/posts/usage/*.md", "/en/posts/usage/");

declare const data: CategoryPostMeta[];
export { data };
export default postsData;
