---
outline: deep
published: 2026-06-15T13:55:00Z
author:
  - name: HowieHz
    link: https://github.com/HowieHz
    email: howie_hzgo@outlook.com
references:
  - name: Halo CMS 表单定义的隐藏规则 | 皓子的小站
    link: https://howiehz.top/archives/halo-form-key
  - name: 表单定义 | Halo 文档
    link: https://docs.halo.run/developer-guide/form-schema
---

# 为表单字段指定 key

## 问题背景

Halo CMS 的主题和插件表单使用 FormKit Schema 定义。当表单字段通过 `if` 条件切换显示，并且同一位置会渲染不同类型的字段时，可能出现字段组件被复用导致的显示异常。

典型场景如下：一个开关控制两个字段互斥显示，`switch1` 为 `true` 时显示数字输入框 `a`，为 `false` 时显示开关字段 `b`。

```yaml
# settings.yaml
spec:
  forms:
    - group: group1
      label: 组标签
      formSchema:
        - $formkit: switch
          name: switch1
          label: 开关
          value: false
        - $formkit: number
          name: a
          if: "$switch1 === true"
          label: 真时显示，number 类型
          value: 200
        - $formkit: switch
          name: b
          if: "$switch1 === false"
          label: 假时显示，switch 类型
          value: true
```

在这种配置下，切换 `switch1` 并保存后，表单界面可能出现字段类型、值或交互状态不一致的情况。刷新页面后通常会恢复正常。

正常显示状态：

![条件为 false 时显示 switch 字段](/images/posts/general-tips/form-schema-key/halo-form-key-1.avif)

![条件为 true 时显示 number 字段](/images/posts/general-tips/form-schema-key/halo-form-key-2.avif)

异常显示状态：

![false 切换 true 保存后出现渲染异常](/images/posts/general-tips/form-schema-key/halo-form-key-3.avif)

![true 切换 false 保存后出现渲染异常](/images/posts/general-tips/form-schema-key/halo-form-key-4.avif)

## 原因

上述配置中的 `a` 和 `b` 虽然是两个不同的表单字段，但在前端渲染时都会对应到同一位置上的 `FormKit` 组件。

当条件变化后，Vue 会根据组件类型和所在位置判断是否复用已有组件实例。由于切换前后仍然是 `FormKit` 组件，Vue 可能复用旧实例，从而保留了不应继续存在的内部状态。

## 配置方式

为参与条件切换的字段显式指定 `key`，让 Vue 能够区分它们是不同的组件实例。

```yaml
# settings.yaml
spec:
  forms:
    - group: group1
      label: 组标签
      formSchema:
        - $formkit: switch
          name: switch1
          label: 开关
          value: false
        - $formkit: number
          name: a
          key: a # [!code ++]
          if: "$switch1 === true"
          label: 真时显示，number 类型
          value: 200
        - $formkit: switch
          name: b
          key: c # [!code ++]
          if: "$switch1 === false"
          label: 假时显示，switch 类型
          value: true
```

`key` 只需要在同一组表单中保持唯一。为减少后续维护成本，通常可直接使用与 `name` 相同的值。

## 建议

在表单 Schema 中，建议为每个包含 `name` 的字段同时配置稳定的 `key`。使用 `if` 条件渲染，或同一位置可能切换为不同字段时，应优先检查这一点。

此问题也可能出现在 `array` 等会动态增删或重排子项的组件中。遇到保存后显示异常、刷新后恢复正常的情况，可以优先检查相关字段是否缺少稳定的 `key`。
