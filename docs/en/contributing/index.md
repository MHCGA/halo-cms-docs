---
publish: false
references:
  - name: "Wikipedia: Beginner's Guide/Editing"
    link: https://en.wikipedia.org/wiki/Wikipedia:Tutorial/Editing
  - name: GitHub Web Editor Documentation
    link: https://docs.github.com/en/codespaces/developing-in-codespaces/web-based-editor
  - name: "OI Wiki: How to Contribute"
    link: https://oi-wiki.org/intro/htc/
---

# Contribution Guide

All maintainers of the Halo CMS Knowledge Base sincerely welcome your contributions. It is thanks to countless contributors like you that we can continuously create and maintain the "Make Halo CMS Great Again" knowledge experience.
This page references best practices from the community and systematically introduces how to write or edit articles for this project. Please read through it carefully before starting to help ensure higher quality submissions.

::: tip Quick Submission

You can directly submit the original article link in an [issue](https://github.com/MHCGA/halo-cms-docs/issues/new), and then project volunteers will help move it into the knowledge base.

:::

## Contributing Guide

Before editing, please read the following materials to stay aligned with community standards:

- [Project Overview and Site Guidelines](/en/about/)
- [Repository README](https://github.com/MHCGA/halo-cms-docs/blob/main/README.en.md)
- Sections below

## Participate in Collaboration

::: warning Reminder
Before writing, please browse the [Issues list](https://github.com/MHCGA/halo-cms-docs/issues) to ensure no one is already working on the same topic. If it appears free, please open a new issue to record your plan and scope for easier collaboration.
:::

::: tip Tip
The iteration plans and Todo labels in Issues aggregate large amounts of pending work — an excellent entry point for understanding project pace and selecting tasks.
:::

To ensure article professionalism and accuracy, please consider the following points before editing:

1. **Prioritize familiar domains**: write based on your technical background or operational experience to produce higher-value content more easily.
2. **Be cautious entering new topics**: if you're still learning a subject, read and practice first to ensure understanding before writing.
3. **Consult authoritative sources**: when citing external perspectives, please attach source links, and you can list reference materials in the `references` field in Frontmatter.

We cherish every contributor's enthusiasm and understand that everyone's experience varies. Let's work together to maintain an accurate and friendly knowledge space. Quoting Wikipedia:

> Don't be afraid to edit, be bold in updating pages!

## Quick Start

1. Install dependencies: `pnpm install`
2. Start the docs site: `pnpm docs:dev`
3. Build artifacts: `pnpm docs:build`
4. Preview artifacts: `pnpm docs:preview`
5. Before submitting, run: `pnpm format` and `pnpm lint`

## Category Scope

1. [Plugin Development Tips](/en/posts/plugins/) · [docs/posts/plugins/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/plugins)
2. [Theme Development Tips](/en/posts/themes/) · [docs/posts/themes/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/themes)
3. [Plugin & Theme Synergy](/en/posts/plugin-theme-synergy/) · [docs/posts/plugin-theme-synergy/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/plugin-theme-synergy)
4. [Usage Tips](/en/posts/usage/) · [docs/posts/usage/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/usage)
5. [Miscellaneous Practices](/en/posts/misc/) · [docs/posts/misc/](https://github.com/MHCGA/halo-cms-docs/tree/main/docs/posts/misc)

> New articles should be placed directly in the corresponding category directory as Markdown files: Chinese originals in `docs/posts/<category>/`, and if translating to English, create the translation in `docs/en/posts/<category>/` using the same filename.

## Frontmatter Template

```yaml
---
author:
  - name: Contributor A
    link: https://github.com/contributor-a
    email: ""
  - name: Contributor B
    link: ""
    email: contributor-b@example.com
references:
  - name: Reference name
    link: https://example.com
---
```

Field explanation:

- `author` (required): at least one author with `name`; both `link` and `email` are optional.
  - `link`: primary contact method (personal website, GitHub profile, etc.); prioritized if present.
  - `email`: fallback contact, only used when `link` is empty or missing. Use empty string `''` if not available.
  - Rendering rules: if `link` exists, link to that address; otherwise link to `email` (formatted as `mailto:`); skip linking if both are empty.
- `references` (optional): reference materials list; each item needs `name` and `link`. Can omit the entire field if no references.

> Frontmatter must be placed at the very beginning of the Markdown file, wrapped by a pair of `---`, with fields in between. The article content must begin with `# Article Title` as a level-one heading.

## Editing on GitHub

Contributing to the Halo CMS Knowledge Base requires a GitHub account (visit the [registration page](https://github.com/signup)). Even as a beginner, following these steps will let you complete edits smoothly.

::: tip Tip
Before your changes are merged, the online site won't be affected. If you're still concerned, refer to the [official GitHub tutorial](https://skills.github.com/).
:::

### Edit a single page

1. Find the target page on this site.
2. Click the **Edit this page** button in the top-right of the article (confirm you've read this page and format conventions) to jump to the GitHub editor.
3. Modify the content in the edit box. Please disable browser auto-translation to avoid changing filenames or Frontmatter.
4. Scroll to the bottom of the page, follow the commit convention below, fill in the information, and click **Propose changes** to submit.
5. GitHub will automatically fork the repository and save your commit, then click the green **Create pull request** button to enter the PR page, fill in the description according to "Pull Request Convention" and submit.

While waiting for review, you can comment on other people's PRs, give thumbs up, or add suggestions. GitHub will notify you via inbox or email when there's new activity.

### Edit multiple pages

1. Open [MHCGA/halo-cms-docs](https://github.com/MHCGA/halo-cms-docs), press <kbd>.</kbd> (or change `github.com` to `github.dev`) to enter the web-based VS Code.
2. Modify multiple files and use the preview button in the top-right corner (or <kbd>Ctrl</kbd> + <kbd>K</kbd>, <kbd>V</kbd>) to check rendering.
3. After completing edits, use the **Source Control** on the left side, fill in information following the commit convention and commit. If prompted to create a branch, click the green **Fork Repository** button.
4. After committing, a prompt box will appear at the top for you to fill in the PR title and target branch in sequence, then confirm to generate the PR.

### Append changes to a PR

1. Open the [Pull Request list](https://github.com/MHCGA/halo-cms-docs/pulls) and enter your submitted PR.
2. Below the PR title you'll see `<your GitHub ID> wants to merge ... from <your branch name>`, click the branch name to jump to your personal Fork.
3. Continue editing based on needs:
   - Few files: edit and commit directly on GitHub.
   - Multiple files: press <kbd>.</kbd> to enter web-based VS Code, then batch commit.
4. All new commits will automatically appear in the original PR without needing to create a new one.

## Editing locally with Git

::: warning Recommendation
If still unfamiliar with Git/GitHub, prefer using the web editor above. Local workflows suit scenarios requiring GPG signatures, batch scripts, or complex collaboration.
:::

General steps:

1. Fork `MHCGA/halo-cms-docs` to your account.
2. Clone your fork locally: `git clone git@github.com:<you>/halo-cms-docs.git`.
3. Create a branch and complete modifications, following the commit convention.
4. `git push` to your fork, then create a PR on GitHub.
5. To append changes, continue committing and pushing locally.

Refer to community Git tutorials for more information.

## Previewing in build pages

Each PR automatically triggers GitHub Actions to ensure lint and build pass. Currently, the repository does not have integrated hosting previews, so please self-check formatting and links locally using `pnpm docs:dev` or `pnpm docs:preview`.

## Directory and link adjustments

- If you must change the path of a published page, please simultaneously update any manually referenced links (such as README, related articles).
- The repository currently does not maintain separate redirect files. URL changes could result in dead links, so please explain the changes in your PR description for maintainers to add redirects at deployment.

## Frontmatter Responsibilities

When creating articles, you need to maintain the `author` and `references` fields in Frontmatter:

- If multiple people co-author, list each author's `name` in the `author` list in order; add `link` and `email` as needed.
- The page automatically renders author/reference sections based on Frontmatter, so keep content consistent and accurate.
- If the article references external materials, list the name and link in `references`. If there are no references, you can omit the entire field.
- If modifying someone else's article, please mention the original author in your PR description to respect attribution.

## Commit Convention

```text
<type>(<scope>): <one-line description>
```

Recommended types:

- `feat`: new content or features
- `fix`: corrections to documentation/code problems
- `refactor`: large-scale structural adjustments
- `docs`: documentation supplements or formatting fixes
- `revert`: revert previous commits

Commit summary should not exceed 50 characters; if more explanation is needed, add it in the body.

## Pull Request Convention

1. **Title**: `<type>(<scope>): <change summary> (#<issue number, optional>)`
2. **Description**: explain what was done and why. If resolving an issue, attach `fix #123`.
3. **Template checklist**: confirm you've read the contribution guide and community covenant (follow Halo community guidelines).

Examples:

- `fix(posts/usage): fix staged release flow diagram (#42)`
- `feat(posts/plugins): add hot-reload debugging guide`
- `docs(contributing): clarify commit convention`

## Collaboration Flow

1. After PR creation, the system automatically notifies reviewers and starts CI.
2. After GitHub Actions completes, you can check the status and logs at the bottom of the PR.
3. Reviewers will provide suggestions through reviews or comments; if marked as `changes requested`, update following the "Append changes" section above.
4. At least two reviewers must approve before merging; for major changes, Maintainer will perform a final review.
5. After merging into `main`, CI will rebuild the site and sync to production.

## FAQ

- **How do I find reviewers?** You can @mention frequent reviewers in the PR description, or request assignment in the group chat/Issue.
- **When should other language versions be synced?** After the Chinese article is merged, you can create a translation in the `docs/en/` directory and note the translation status in the PR.
- **Do I need images or attachments?** Please place images in `public/` or in an `images/` directory at the same level as the article, and use relative paths in Markdown.
