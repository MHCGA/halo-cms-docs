---
authors:
  - name: 秦楠
    url: ''
    email: nan.qin@example.com
references:
  - name: 自动化脚本仓库
    url: https://github.com/example/halo-release-pipeline
---

# Halo 内容分阶段发布流水线

## 场景描述

团队需要在 Halo 中编排营销稿件，要求草稿可预览，合规审批后自动进入生产站点。

## 方案设计

1. 通过 `content:publish` Webhook 捕获审核通过事件。
2. GitHub Actions 拉取 Markdown，运行 `pnpm lint:content` 校验。
3. 依据标签 `stage:preview`、`stage:prod` 分支部署到不同环境。

## 实施步骤

- 在 Halo 设置三个 Webhook，分别对应草稿、预发布、回滚。
- 采用 `pnpm --filter docs build` 生成静态文件，部署到 OSS。
- 使用 Cloudflare Workers 将 `/preview` 请求转发到预发布桶。

## 经验总结

- 所有环境共享同一 CDN 域名，避免跨域。
- 把审批日志同步到 Halo 审计中心，方便追踪。
- 通过 `slack-notify` Action 向频道推送分发结果。
