---
authors:
  - name: 赵珊
    url: ''
    email: shan.zhao@example.com
references:
  - name: 参考博文
    url: https://blog.example.com/halo-theme-responsive
---

# 响应式主题蓝图与样式分层

## 设计目标

在多终端场景下保持统一体验，同时允许主题包根据品牌色或组件密度快速定制。

## 样式分层策略

- **设计令牌**：使用 JSON 声明颜色、间距、字号，再同步到 Less 与 CSS 变量。
- **布局层**：`layouts/*.ftl` 只负责结构，不在模板里写死颜色或字体。
- **组件层**：复杂组件拆成独立宏，方便按需覆盖。

## 验证步骤

1. 结合 `pnpm docs:dev` 启动示例主题并启用移动预览。
2. 使用 Chrome DevTools 设备模拟器检查常见断点。
3. 编写 Playwright 测试验证导航、搜索与评论交互。

## 相关资源

- [Halo 主题开发指北](https://docs.halo.run/theme-guide.html)
- [Design Token W3C Draft](https://design-tokens.github.io/community-group/format/)
