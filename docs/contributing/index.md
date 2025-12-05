---
publish: false
references:
  - name: "Wikipedia: 新手入门/编辑"
    link: https://zh.wikipedia.org/wiki/Wikipedia:%E6%96%B0%E6%89%8B%E5%85%A5%E9%96%80/%E7%B7%A8%E8%BC%AF
  - name: GitHub Web 编辑器说明
    link: https://docs.github.com/zh/codespaces/developing-in-codespaces/web-based-editor
  - name: "OI Wiki: 如何参与"
    link: https://oi-wiki.org/intro/htc/
---

# 投稿指南

在开始之前，Halo CMS 知识库全体维护者诚挚欢迎你加入。正是因为有无数位和你一样的贡献者，我们才能持续打造“Make Halo CMS Great Again”的内容体验。该页面参考社区优秀做法，系统介绍如何为本项目撰稿或修订文章，请务必在动笔前通读一遍，以帮助你提交更高质量的内容。

::: tip 快速投稿

可以直接发原文链接在 [issue](https://github.com/MHCGA/halo-cms-docs/issues/new) 投稿，然后项目志愿者会帮忙加入知识库。

:::

## 贡献指南

在动手编辑前，请先阅读下列资料，便于与社区保持一致：

- [项目简介与站点方针](/about/)
- [仓库 README](https://github.com/MHCGA/halo-cms-docs/blob/main/README.md)
- 本页下方的章节

## 参与协作

::: warning 温馨提示
开始编写前，请先浏览 [Issues 列表](https://github.com/MHCGA/halo-cms-docs/issues)，确认没有人正在处理同一主题；若确认空闲，请开一个新议题记录计划和范围，便于协作。
:::

::: tip 小建议
Issues 中的迭代计划与 Todo 标签聚合了大量待办工作，是了解项目节奏、挑选任务的绝佳入口。
:::

为了保证稿件的专业性与准确性，请在编辑前思考以下几点：

1. **优先选择熟悉的领域**：围绕自身的技术背景或运营经验撰写，更容易输出高价值内容。
2. **谨慎进入全新主题**：如果你对某个话题仍在入门，请先阅读/实践，确保理解后再撰稿。
3. **查阅权威资料**：引用外部观点时请附上来源链接，必要时可在 `Frontmatter` 的 `references` 字段列出参考资料。

我们珍惜每位贡献者的热情，也理解大家的经验各不相同。让我们携手维护一个准确、友好的知识空间。引用维基百科的一句话：

> 不要害怕编辑，勇于更新页面！

## 快速上手

1. 安装依赖：`pnpm install`
2. 启动文档站：`pnpm docs:dev`
3. 构建产物：`pnpm docs:build`
4. 预览产物：`pnpm docs:preview`
5. 提交前执行：`pnpm format`、`pnpm lint`

## 分类范围

1. [插件开发技巧](/posts/plugins/) · [docs/posts/plugins/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/plugins)
2. [主题开发技巧](/posts/themes/) · [docs/posts/themes/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/themes)
3. [插件与主题协同技巧](/posts/plugin-theme-synergy/) · [docs/posts/plugin-theme-synergy/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/plugin-theme-synergy)
4. [使用技巧](/posts/usage/) · [docs/posts/usage/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/usage)
5. [其他实践](/posts/misc/) · [docs/posts/misc/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/misc)

> 新文章请直接放入对应目录下的 Markdown 文件：中文稿位于 `docs/posts/<分类>/`，若同步英文版本，请在 `docs/en/posts/<分类>/` 中使用相同文件名创建译文。

## Frontmatter 模板

```yaml
---
author:
  - name: 投稿者 A
    link: https://github.com/contributor-a
    email: ""
  - name: 投稿者 B
    link: ""
    email: contributor-b@example.com
references:
  - name: 参考资料名称
    link: https://example.com
---
```

字段说明：

- `author`（必填）：至少填写一位作者的 `name`；`link` 和 `email` 均可选。
  - `link`：主要联系方式（个人网站、GitHub 主页等），若存在则优先使用。
  - `email`：备选联系方式，仅在 `link` 为空或缺失时使用。若无邮箱可填空字符串 `''`。
  - 渲染规则：若 `link` 存在则链接至该地址，否则链接至 `email`（格式为 `mailto:`），两项都为空则不生成链接。
- `references`（可选）：引用资料列表；每项需要 `name` 与 `link`，若没有参考资料可省略整个字段。

> Frontmatter 必须位于 Markdown 文件最开头，并用一对 `---` 包裹，中间填写上述字段；正文须以 `# 文章标题` 的一级标题开头。

## 在 GitHub 上编辑

参与 Halo CMS 知识库需要一个 GitHub 账号（可前往 [注册页面](https://github.com/signup)）。即便你是新手，只要按以下步骤操作，也能顺利完成编辑。

::: tip 小贴士
在你的更改合并前，线上站点不会受到影响；如果仍担心，可以参考 [GitHub 官方教程](https://skills.github.com/)。
:::

### 编辑单个页面

1. 在本站找到目标页面。
2. 点击正文右上方的 **「编辑此页」** 按钮（确认你已阅读本页与格式约定），跳转到 GitHub 编辑器。
3. 在编辑框内修改内容。请关闭浏览器自动翻译，避免误改文件名或 Frontmatter。
4. 滚动至页面底部，按照下文的 commit 规范填写信息，点击 **Propose changes** 提交。
5. GitHub 会自动 Fork 仓库并保存你的提交，随后点击绿色 **Create pull request** 按钮进入 PR 页面，按照“Pull Request 规范”填写说明后提交。

等待审核期间，你可以在他人 PR 下评论、点赞或补充建议；若有新消息，GitHub 会通过站内通知或邮件提醒。

### 编辑多个页面

1. 打开 [MHCGA/halo-cms-docs](https://github.com/MHCGA/halo-cms-docs) 仓库，按下 <kbd>.</kbd>（或把 `github.com` 改为 `github.dev`）进入网页版 VS Code。
2. 在编辑器中修改多个文件，可使用右上角预览按钮（或 <kbd>Ctrl</kbd> + <kbd>K</kbd>、<kbd>V</kbd>）查看渲染效果。
3. 修改完成后使用左侧 **Source Control**，按 commit 规范填写信息并提交。若提示创建分支，点击绿色 **Fork Repository** 按钮即可。
4. 提交后顶部会弹出提示框，依次填写 PR 标题、目标分支，确认后即可生成 PR。

### 向 PR 追加更改

1. 打开 [Pull Request 列表](https://github.com/MHCGA/halo-cms-docs/pulls)，进入你提交的 PR。
2. PR 标题下方会显示 `<你的 GitHub ID> wants to merge ... from <你的分支名>`，点击分支名即可跳转到个人 Fork。
3. 根据需求继续编辑：
   - 少量文件：在 GitHub 网页端直接修改并 Commit。
   - 多文件：按 <kbd>.</kbd> 进入网页版 VS Code，再批量提交。
4. 所有新增提交都会自动出现在原 PR 中，无需重新创建。

## 使用 Git 在本地编辑

::: warning 建议
若对 Git/GitHub 仍不熟悉，优先使用上方的 Web 编辑器；本地流程适合需要 GPG 签名、批量脚本或复杂联调的场景。
:::

大致步骤：

1. Fork `MHCGA/halo-cms-docs` 至个人账号。
2. 将 Fork 仓库克隆到本地：`git clone git@github.com:<you>/halo-cms-docs.git`。
3. 创建分支并完成修改，按规范填写 commit。
4. `git push` 至个人 Fork，然后在 GitHub 上创建 PR。
5. 需要追加改动时，在本地继续提交并推送即可。

更多 Git 用法可参考社区教程。

## 在构建页面中预览

每个 PR 会自动触发 GitHub Actions 构建，用于保证 lint 与 build 通过。目前仓库未接入托管预览，请在本地 `pnpm docs:dev` 或 `pnpm docs:preview` 中自查排版与链接。

## 目录与链接调整

- 若必须变更已发布页面的路径，请同步更新任何手动引用的链接（如 README、相关文章）。
- 目前仓库不维护额外的重定向文件，若 url 变化会造成死链，请在 PR 描述中说明，便于管理员在部署端补充跳转。

## Frontmatter 责任

建文稿时需在 Frontmatter 中维护 `author`、`references` 等字段：

- 若多人共同创作，请在 `author` 列表中依次填写每位作者的 `name`，`link` 和 `email` 视情况添加。
- 页面会依据 Frontmatter 自动渲染文章开结尾的作者/参考资料信息，请保持内容一致、真实。
- 若文章引入外部素材，请在 `references` 中列出名称与链接；没有引用时可省略。
- 若修改了他人文章，请在 PR 描述中说明原作者，尊重署名。

## Commit 信息规范

```text
<类型>(<范围>): <一句话描述>
```

推荐类型：

- `feat`：新增内容或功能
- `fix`：修正文档/代码问题
- `refactor`：较大范围的结构调整
- `docs`：文档类补充或排版修复
- `revert`：回滚先前提交

Commit 摘要不超过 50 个字符；若需更多说明，可在正文补充。

## Pull Request 信息规范

1. **标题**：`<类型>(<范围>): <改动概述> (#<issue 编号，可选>)`
2. **描述**：说明做了什么、为何修改，如解决了某个 issue，请附上 `fix #123`。
3. **勾选模板**：提交 PR 时请确认已阅读贡献指南与社区公约（遵循 Halo 社区守则）。

示例：

- `fix(posts/usage): 修复分阶段发布流程图 (#42)`
- `feat(posts/plugins): 新增热重载调试指南`
- `docs(contributing): 明确 commit 规范`

## 协作流程

1. PR 创建后，系统会自动通知 reviewer 并启动 CI。
2. GitHub Actions 完成后，你可在 PR 底部查看状态与日志。
3. Reviewer 会通过 Review 或评论提出建议；若标记为 `changes requested`，请按上述“追加更改”步骤更新。
4. 至少两位 reviewer 通过后才能合并；若涉及重大改动，Maintainer 会再做一次终审。
5. 合并进 `main` 分支后，CI 会重新构建站点并同步至生产环境。

## 常见问题

- **如何寻找审稿人？** 可在 PR 描述中 @ 常驻 reviewer，或在群聊/Issue 中请求分配。
- **其他语言版本何时同步？** 中文稿合并后，可在 `docs/en/` 等目录下创建翻译稿，并在 PR 中注明"翻译同步状态"。
- **需要配图或附件吗？** 请将图片放在 `public/` 或与文章同级的 `images/` 目录，并在 Markdown 中使用相对路径。
