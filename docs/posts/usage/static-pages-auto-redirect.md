---
author:
  - name: HowieHz
    link: https://github.com/HowieHz
references:
  - name: VitePress | 生成简洁的 URL
    link: https://vitepress.dev/zh/guide/routing#generating-clean-url
---

# 静态网页服务插件内部自动重定向

在 Halo 的[静态网页服务插件](https://www.halo.run/store/apps/app-gFkMn)里上传前端构建产物后，最棘手的问题是如何实现路径回退：服务需要像 [Netlify/Vercel/GitHub Pages](https://vitepress.dev/zh/guide/routing#generating-clean-url) 那样，内部自动在“原始路径 -> `.html` -> `/index.html`”重定向。

## 路由策略实现

以下示例以 `project-a|project-b|project-c` 作为占位目录名（含义是处理这三个目录：`/project-a/**`、`/project-b/**`、`/project-c/**`），部署时请改为实际目录名。以及将 `http://halo-backend.internal:8080` 改为 Halo CMS 实例地址。

- 原始路径：只匹配无扩展路径，兼容有无尾随斜杠。
- `.html`：适合 VitePress 等构建输出的[干净链接](https://vitepress.dev/zh/guide/routing#generating-clean-url)。
- `/index.html`：最后落到目录入口，适用于 SPA。

```nginx
# 1. 匹配无扩展路径（兼容有无尾随斜杠）
location ~ ^/(project-a|project-b|project-c)/(?:[^/]+/)*[^/.]+/?$ {
    # 2. 附加 .html
    rewrite ^/(project-a|project-b|project-c)/(.*?)/?$ /$1/$2.html break;

    proxy_pass http://halo-backend.internal:8080;

    proxy_intercept_errors on;
    error_page 404 = @try_index_html;
}

# 3. 尝试 index.html
location @try_index_html {
    rewrite ^/(.+)\.html$ /$1/index.html break;
    proxy_pass http://halo-backend.internal:8080;
}
```

实例：

- 访客访问以下其中一个地址：
  - `.../project-a/posts/plugins`
  - `.../project-a/posts/plugins/`
- 内部首先尝试 `.../project-a/posts/plugins.html`
- 如果失败就尝试 `.../project-a/posts/plugins/index.html`

## 组合示例

具体的 `proxy_set_header`、`proxy_cache`、`Alt-Svc` 等细节则可按各自环境补齐。

```nginx
# 1. 静态网页服务插件部署的文档 assets 目录优先、长缓存
location ~ ^/(project-a|project-b|project-c)/assets/.*\.(gif|png|jpe?g|svg|webp|avif|css|js|woff2?|ttf|eot|ico)$ {
    proxy_pass http://halo-backend.internal:8080;
    expires 365d; # 可配合 Cache-Control immutable
}

# 2. 无扩展路径：原始 -> .html -> /index.html
location ~ ^/(project-a|project-b|project-c)/(?:[^/]+/)*[^/.]+/?$ {
    rewrite ^/(project-a|project-b|project-c)/(.*?)/?$ /$1/$2.html break;

    proxy_pass http://halo-backend.internal:8080;

    proxy_intercept_errors on;
    error_page 404 = @try_index_html;
}

# 处理 404 后的 /index.html 重试
location @try_index_html {
    rewrite ^/(.+)\.html$ /$1/index.html break;

    proxy_pass http://halo-backend.internal:8080;
}

# 3. Halo CMS 本体静态资源处理（带版本号匹配）
location ~* \.(gif|png|jpe?g|css|js|woff2?|svg|webp|avif)(\?(v|version)=\d+\.\d+\.\d+)?$ {
    proxy_pass http://halo-backend.internal:8080;
    expires 365d;
}

# 4. Halo CMS 本体
location / {
    proxy_pass http://halo-backend.internal:8080;

    if ($uri ~* "\.(gif|png|jpe?g|css|js|woff2?|svg|webp|avif)$") {
        expires 365d;
    }
}
```
