---
outline: deep
published: 2026-04-14T08:55:00Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: howie_hzgo@outlook.com
references:
  - name: 页面转换器
    link: https://www.halo.run/store/apps/app-ncyyngrz
---

# 移除页面中多余的插件资源

## 问题背景

在 Halo CMS 中，有些插件为了尽量兼容主题的 Ajax、PJAX、Swup 等全站无刷新方案，会选择把自己的脚本和样式插入到**每一个页面**。

但在实际部署中，很多站点并不一定真的需要这样做，例如：

- 主题本身并没有使用全站无刷新方案
- 插件功能只会出现在少量页面

由此会产生额外的请求、带宽和脚本执行开销。

如果不想直接修改插件源码，也可以使用[页面转换器](https://www.halo.run/store/apps/app-ncyyngrz)插件，在不需要的页面移除对应资源。

## 确定要移除哪些资源

在写规则之前，先确认插件实际注入了哪些资源。可以在浏览器开发者工具中查看页面源码或网络请求，重点留意插件插入的 `<script>`、`<link rel="stylesheet">` 以及 `/plugins/` 相关路径。

例如：

```html
<link rel="stylesheet" href="/plugins/plugin-a/assets/player.css" />
<script src="/plugins/plugin-a/assets/player.js"></script>
```

## 配置示例

下面直接给出几个示例。这些规则的共同思路都是：

- 先用 CSS 选择器精确命中插件注入的资源标签。
- 再用匹配规则描述哪些页面允许保留。
- 最后在最外层取反，变成“除了这些页面，其他页面都移除”。

### 示例 1：按需移除“评论组件”插件的样式/脚本预加载

作用：在不需要的页面移除[评论组件](https://www.halo.run/store/apps/app-YXyaD)插件注入的预加载标签。

范围：

- `/archives/**` 的文章页保留预加载资源。（`/archives` 和 `/archives/page/*` 是文章归档页，不保留预加载资源）
- `/moments` 和 `/moments/page/*` 的瞬间列表页保留预加载资源。
- `/moments/*` 的瞬间详情页保留预加载资源。
- `/about` 是一个自定义的页面，在此保留预加载资源。导入后可按需调整此规则。
- 其他页面都移除资源。

```json
{
  "$schema": "https://raw.githubusercontent.com/HowieHz/halo-plugin-transformer/main/ui/public/generated/transformer.schema.json",
  "version": 1,
  "resourceType": "rule",
  "data": {
    "enabled": true,
    "name": "按需移除“评论组件”插件的样式/脚本预加载",
    "description": "",
    "mode": "SELECTOR",
    "match": "link[href^=\"/plugins/PluginCommentWidget\"]",
    "position": "REMOVE",
    "wrapMarker": false,
    "runtimeOrder": 2147483645,
    "matchRuleSource": {
      "kind": "RULE_TREE",
      "data": {
        "type": "GROUP",
        "negate": true,
        "operator": "AND",
        "children": [
          {
            "type": "GROUP",
            "negate": false,
            "operator": "OR",
            "children": [
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/archives/**"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/about"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/moments/page/*"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/moments/*"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/moments"
              }
            ]
          },
          {
            "type": "GROUP",
            "negate": true,
            "operator": "OR",
            "children": [
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/archives"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/archives/page/*"
              }
            ]
          }
        ]
      }
    }
  }
}
```

### 示例 2：按需移除“联系表单”插件样式/脚本

作用：在不需要的页面移除[联系表单](https://www.halo.run/store/apps/app-gSebd)插件注入的资源。

范围：

- 在 `/about` 这个自定义页面保留资源。（`/about` 是自己创建的页面，你可以将其改为其他的。）
- 其他页面都移除资源。

```json
{
  "$schema": "https://raw.githubusercontent.com/HowieHz/halo-plugin-transformer/main/ui/public/generated/transformer.schema.json",
  "version": 1,
  "resourceType": "rule",
  "data": {
    "enabled": true,
    "name": "按需移除”联系表单”插件样式/脚本",
    "description": "",
    "mode": "SELECTOR",
    "match": "link[href^=\"/plugins/PluginContactForm\"], script[src^=\"/plugins/PluginContactForm\"]",
    "position": "REMOVE",
    "wrapMarker": false,
    "runtimeOrder": 2147483645,
    "matchRuleSource": {
      "kind": "RULE_TREE",
      "data": {
        "type": "GROUP",
        "negate": true,
        "operator": "AND",
        "children": [
          {
            "type": "PATH",
            "negate": false,
            "matcher": "EXACT",
            "value": "/about"
          }
        ]
      }
    }
  }
}
```

### 示例 3：按需移除 Shiki 代码高亮插件脚本注入

作用：在不需要的页面移除[Shiki 代码高亮](https://www.halo.run/store/apps/app-kzloktzn)插件注入的脚本。

范围：同[示例 1](#示例-1按需移除评论组件插件的样式脚本预加载)。

```json
{
  "$schema": "https://raw.githubusercontent.com/HowieHz/halo-plugin-transformer/main/ui/public/generated/transformer.schema.json",
  "version": 1,
  "resourceType": "rule",
  "data": {
    "enabled": true,
    "name": "按需移除 Shiki 代码高亮插件脚本注入",
    "description": "",
    "mode": "SELECTOR",
    "match": "script[src^=\"/plugins/shiki\"]",
    "position": "REMOVE",
    "wrapMarker": false,
    "runtimeOrder": 2147483645,
    "matchRuleSource": {
      "kind": "RULE_TREE",
      "data": {
        "type": "GROUP",
        "negate": true,
        "operator": "AND",
        "children": [
          {
            "type": "GROUP",
            "negate": false,
            "operator": "OR",
            "children": [
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/archives/**"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/about"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/moments/page/*"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/moments/*"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/moments"
              }
            ]
          },
          {
            "type": "GROUP",
            "negate": true,
            "operator": "OR",
            "children": [
              {
                "type": "PATH",
                "negate": false,
                "matcher": "EXACT",
                "value": "/archives"
              },
              {
                "type": "PATH",
                "negate": false,
                "matcher": "ANT",
                "value": "/archives/page/*"
              }
            ]
          }
        ]
      }
    }
  }
}
```
