---
authors:
  - name: 林佑
    url: ''
    email: lin.you@example.com
  - name: 何雯
    url: ''
    email: he.wen@example.com
references:
  - name: 实践指南
    url: https://howiehz.top/mhcga/extensions-hooks
---

# 插件与主题共享 Hook 的实践

## 背景

多语言主题需要从插件读取扩展字段，而插件也需要获得主题的布局状态，传统 REST 接口易出现耦合。

## 协同模型

1. 约定 `plugin.theme.*` 命名空间，用于主题监听插件事件。
2. 在插件暴露 `server-extension`，将 DTO 注入 Halo 事件总线。
3. 主题侧通过 `Halo.eventBus.subscribe` 注册回调，把数据映射到模板。

## 实施要点

- 在 `extension.yaml` 中声明 Hook 名称并写入文档。
- 通过 `JSON Schema` 校验事件 payload，避免前后端不一致。
- 引入 `AbortController` 控制异步事件，防止主题卸载时仍然触发。

## 参考实现

- [事件驱动的 Halo 插件](https://github.com/halo-dev)
- [Theme <-> Plugin 数据协议示例](https://gist.github.com/example/abc123)
