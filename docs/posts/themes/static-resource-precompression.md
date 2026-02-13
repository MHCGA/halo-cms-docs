---
published: 2026-02-13T06:52:00Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: ""
references:
  - name: 皓子的小站 | 静态资源预压缩：零运行时开销，极致节省带宽
    link: https://howiehz.top/archives/static-resource-precompression
  - name: google/ngx_brotli | MIME 配置参考
    link: https://github.com/google/ngx_brotli#sample-configuration
  - name: nonzzz/vite-plugin-compression | nginx 和 Apache 配置参考
    link: https://github.com/nonzzz/vite-plugin-compression#production-deployment
---

# 实现静态资源预压缩

## 原理

构建时预压缩，以高压缩等级生成对应文件，服务器在运行时直接提供压缩后的文件。

一般约定：

| 算法      | 文件后缀 | 普及情况                                             |
| --------- | -------- | ---------------------------------------------------- |
| gzip      | .gz      | [gzip](https://caniuse.com/sr-content-encoding-gzip) |
| brotli    | .br      | [brotli](https://caniuse.com/brotli)                 |
| zstandard | .zst     | [zstd](https://caniuse.com/zstd)                     |

例：如果你看到 `1.js.br`，说明是由 `1.js` 使用 brotli 算法预压缩生成的文件。

注：截止于 2026 年 2 月 13 日，zstd 未进入 baseline。建议当前仅部署 gzip 和 brotli 预压缩版本。

## 优势与劣势

预压缩有以下优势：

- 节约服务器内存资源。
- 节约服务器 CPU 资源。
- 节约服务器带宽。

劣势：

- 需占用更多的存储空间。
- 编译时需消耗更多的 CPU 和内存资源，以及更长的耗时。
- 分发的主题包和插件包会相较于之前更大。

## 如何配置

### 构建配置

- Vite: [适用于 Vite 的配置](#适用于-vite-的配置)

#### 适用于 Vite 的配置

安装 [vite-plugin-compression2](https://www.npmjs.com/package/vite-plugin-compression2) 插件进行预压缩：

选择合适的安装方式：

```bash
npm install vite-plugin-compression2 -D
```

```bash
pnpm add vite-plugin-compression2 -D
```

```bash
yarn add vite-plugin-compression2 -D
```

安装完成后配置 `vite.config.ts`：

```ts
import { constants } from "node:zlib";
import { compression, defineAlgorithm } from "vite-plugin-compression2";

export default defineConfig({
  // 其他配置
  plugins: [
    // 其他插件
    compression({
      algorithms: [
        // 设置为最大压缩等级 9
        defineAlgorithm("gzip", { level: 9 }),
        // 设置为最大压缩等级 11
        defineAlgorithm("brotliCompress", {
          params: {
            [constants.BROTLI_PARAM_QUALITY]: 11,
          },
        }),
        // 最大压缩等级是 22，内存消耗量较大。如构建失败，可设置为 21，20，或去除这段。
        defineAlgorithm("zstandard", {
          params: {
            [constants.ZSTD_c_compressionLevel]: 22,
          },
        }),
      ],
      include: [
        // 可按需补充其他后缀
        /\.(atom|rss|xml|xhtml|js|mjs|ts|html|json|css|eot|otf|ttf|svg|ico|bmp|dib|txt|text|log|md|conf|ini|cfg)$/,
      ],
    }),
  ],
  // 其他配置
});
```

### 部署配置

- Halo CMS: [在 Halo CMS 上使用](#在-halo-cms-上使用)
- nginx: [在 nginx 上使用](#在-nginx-上使用)
- Apache: [在 Apache 上使用](#在-apache-上使用)

#### 在 Halo CMS 上使用

经检查，Halo CMS v2.22.14 会自动采用 `.br` 文件，但不会自动采用 `.zst` 文件。

#### 在 nginx 上使用

```nginx
http {
    # nginx 会根据 Accept-Encoding 决定提供哪种格式的文件，因此不同算法配置顺序不影响结果。

    # 启用 gzip_static 模块以提供预压缩的 .gz 文件
    gzip_static on;

    # 如果找不到静态文件则回退到动态压缩
    gzip on;
    gzip_types application/atom+xml application/javascript application/json application/vnd.api+json application/rss+xml application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/x-javascript application/xhtml+xml application/xml font/eot font/opentype font/otf font/truetype image/svg+xml image/vnd.microsoft.icon image/x-icon image/x-win-bitmap text/css text/javascript text/plain text/xml;
    # 用于在 HTTP 响应头中添加 Vary: Accept-Encoding 字段
    gzip_vary on;
    # 让 nginx 也动态压缩反向代理的内容
    gzip_proxied expired no-cache no-store private auth;

    # 启用 brotli_static 以提供预压缩的 .br 文件
    # 需要 ngx_brotli 模块: https://github.com/google/ngx_brotli
    # 如果你使用 1Panel 面板：
    #     可前往 /websites 页面，点击设置->模块->启用 ngx_brotli->构建，即可启用。
    brotli_static on;

    # 如果找不到静态文件则回退到动态压缩
    brotli on;
    brotli_types application/atom+xml application/javascript application/json application/vnd.api+json application/rss+xml application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/x-javascript application/xhtml+xml application/xml font/eot font/opentype font/otf font/truetype image/svg+xml image/vnd.microsoft.icon image/x-icon image/x-win-bitmap text/css text/javascript text/plain text/xml;

    # 启用 zstd_static 以提供预压缩的 .zst 文件
    # 需要 zstd-nginx-module 模块: https://github.com/tokers/zstd-nginx-module
    zstd_static on;

    # 如果找不到静态文件则回退到动态压缩
    zstd on;
    zstd_types application/atom+xml application/javascript application/json application/vnd.api+json application/rss+xml application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/x-javascript application/xhtml+xml application/xml font/eot font/opentype font/otf font/truetype image/svg+xml image/vnd.microsoft.icon image/x-icon image/x-win-bitmap text/css text/javascript text/plain text/xml;

    server {
        # 其他配置
        listen 80;
        server_name example.com;
        root /var/www/html;

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### 在 Apache 上使用

```apache
# 启用 mod_deflate 以实现回退动态压缩
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE application/atom+xml application/javascript application/json application/vnd.api+json application/rss+xml application/vnd.ms-fontobject application/x-font-opentype application/x-font-truetype application/x-font-ttf application/x-javascript application/xhtml+xml application/xml font/eot font/opentype font/otf font/truetype image/svg+xml image/vnd.microsoft.icon image/x-icon image/x-win-bitmap text/css text/javascript text/plain text/xml
</IfModule>

# 提供预压缩文件
<IfModule mod_rewrite.c>
    RewriteEngine On

    # 如果存在 .zst 文件且客户端支持 zstd，则提供该文件
    RewriteCond %{HTTP:Accept-Encoding} zstd
    RewriteCond %{REQUEST_FILENAME}.zst -f
    RewriteRule ^(.*)$ $1.zst [L]

    # 如果存在 .br 文件且客户端支持 brotli，则提供该文件
    RewriteCond %{HTTP:Accept-Encoding} br
    RewriteCond %{REQUEST_FILENAME}.br -f
    RewriteRule ^(.*)$ $1.br [L]

    # 如果存在 .gz 文件且客户端支持 gzip，则提供该文件
    RewriteCond %{HTTP:Accept-Encoding} gzip
    RewriteCond %{REQUEST_FILENAME}.gz -f
    RewriteRule ^(.*)$ $1.gz [L]
</IfModule>

# 设置正确的 content-type 和 encoding headers
<FilesMatch "\.js\.gz$">
    Header set Content-Type "application/javascript"
    Header set Content-Encoding "gzip"
</FilesMatch>

<FilesMatch "\.css\.gz$">
    Header set Content-Type "text/css"
    Header set Content-Encoding "gzip"
</FilesMatch>

<FilesMatch "\.js\.br$">
    Header set Content-Type "application/javascript"
    Header set Content-Encoding "br"
</FilesMatch>

<FilesMatch "\.css\.br$">
    Header set Content-Type "text/css"
    Header set Content-Encoding "br"
</FilesMatch>

<FilesMatch "\.js\.zst$">
    Header set Content-Type "application/javascript"
    Header set Content-Encoding "zstd"
</FilesMatch>

<FilesMatch "\.css\.zst$">
    Header set Content-Type "text/css"
    Header set Content-Encoding "zstd"
</FilesMatch>
```

## 如何确定生效

1. 确定你的浏览器支持所选择的协议：[gzip](https://caniuse.com/sr-content-encoding-gzip)，[brotli](https://caniuse.com/brotli)，[zstd](https://caniuse.com/zstd)。
2. 打开浏览器的开发者工具。
3. 选择“网络”（Network）分页。
4. 刷新网页，点击你要检查的文件（比如 `.js` 后缀的文件）
5. 查看标头（Headers），找到 `Content-Encoding`，如果是 `br`, `gzip`, `zstd`，说明正确采用了对应的压缩算法传输。

注意：在 114 版本 Edge 上测试，发现在 https 站点/`127.0.0.1` 的情况下 `Accept-Encoding`是 `gzip, deflate, br, zstd`。而在 http 站点上 `Accept-Encoding` 为 `gzip, deflate`。
**结论**：想要使用 brotli 和 zstandard 算法的预压缩文件，需要先给站点配置 https。
