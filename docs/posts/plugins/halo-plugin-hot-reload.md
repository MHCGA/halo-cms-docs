---
authors:
  - name: 刘海
    url: ''
    email: liuhai@example.com
references:
  - name: 示例仓库
    url: https://github.com/example/halo-plugin-hot-reload
---

# Halo 插件热重载调试模板

## 背景

传统的 Halo 插件调试需要频繁重启服务，高频修改接口或数据模型时极为低效。

## 方案概览

- 使用 Vite 构建插件前端资源，实现毫秒级热更新。
- 借助 Halo SDK 的本地沙箱插件运行环境，避免重复打包。
- 通过 `pnpm --filter` 指令按需启动插件与站点服务。

## 实施步骤

1. 在插件根目录添加 `vite.config.ts` 并启用 `hmr`。
2. 配置 `halo-plugin.yaml` 的 `devServer` 指向本地 Vite URL。
3. 在 Halo Admin 中开启“开发者模式”并连接到沙箱插件。
4. 结合 `pnpm --filter halo-admin dev` 同步调试前后台。

## 进一步阅读

- [Halo Plugin Dev Guide](https://docs.halo.run/developer-guide.html)
- [Vite HMR 文档](https://vitejs.dev/guide/api-hmr.html)
