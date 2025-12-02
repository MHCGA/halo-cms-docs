---
publish: false
references:
  - name: "Wikipedia: Tutorial/Editing"
    url: https://en.wikipedia.org/wiki/Wikipedia:Tutorial
  - name: GitHub web-based editor docs
    url: https://docs.github.com/en/codespaces/developing-in-codespaces/web-based-editor
---

# Contribution Guide

The Halo CMS Knowledge Base sincerely welcomes your contributions. Thanks to many contributors like you, we can continuously improve and maintain the “Make Halo CMS Great Again” knowledge base. This page documents our contribution workflow and rules — please read it fully before making edits so your submission meets quality expectations.

> If any discrepancy exists, the Simplified Chinese version is the canonical source.

## Contribution Guidelines

Before editing, please review these resources so your work stays aligned with community conventions:

- [Project overview and site guidelines](/en/about/)
- [Repository README](https://github.com/MHCGA/blog/blob/main/README.md) and [English README](https://github.com/MHCGA/blog/blob/main/README.en.md)
- The rest of the sections on this page, especially 'Submission Rules' and 'Collaboration Flow'

## Collaborating Together

::: warning Heads-up
Check the [Issues list](https://github.com/MHCGA/blog/issues) before drafting. If someone is already working on the same topic, coordinate with them; otherwise, open a new issue to record your plan so others can collaborate.
:::

::: tip Suggestion
The ‘Iteration Plan’ and ‘Todo’ labels on issues often point to good opportunities to contribute — a great place to find tasks.
:::

To keep articles accurate and professional, follow these rules:

1. **Write within your domain** — focus on topics matching your technical or operational experience.
2. **Research before writing** — if a topic is new to you, study and validate your approach before authoring the article.
3. **Cite reliable sources** — add source links inside the article or list them in the frontmatter `references` field.

We appreciate every contributor’s efforts. Let’s keep our knowledge base friendly and reliable. As Wikipedia says:

> Don't be afraid to edit — bold changes are welcome!

## Quick Start

1. Install dependencies: `pnpm install`
2. Start the docs site locally: `pnpm docs:dev`
3. Build the static output: `pnpm docs:build`
4. Preview the build: `pnpm docs:preview`
5. Before committing, run: `pnpm format` and `pnpm lint`

## Category Scope

1. [Plugin development tips](/en/posts/plugins/) · [docs/en/posts/plugins/](https://github.com/MHCGA/blog/tree/main/docs/en/posts/plugins)
2. [Theme development tips](/en/posts/themes/) · [docs/en/posts/themes/](https://github.com/MHCGA/blog/tree/main/docs/en/posts/themes)
3. [Plugin & Theme Synergy](/en/posts/plugin-theme-synergy/) · [docs/en/posts/plugin-theme-synergy/](https://github.com/MHCGA/blog/tree/main/docs/en/posts/plugin-theme-synergy)
4. [Usage tips](/en/posts/usage/) · [docs/en/posts/usage/](https://github.com/MHCGA/blog/tree/main/docs/en/posts/usage)
5. [Miscellaneous practices](/en/posts/misc/) · [docs/en/posts/misc/](https://github.com/MHCGA/blog/tree/main/docs/en/posts/misc)

> Create new Markdown files directly under the matching folder: Chinese originals live in `docs/posts/<category>/`, and translations belong in `docs/en/posts/<category>/` using the same slug.

## Frontmatter Template

```yaml
---
authors:
  - name: Contributor A
    url: https://github.com/contributor-a
    email: ''
  - name: Contributor B
    url: ''
    email: contributor-b@example.com
references:
  - name: Reference name
    url: https://example.com
---
```

Field guidelines:

- `authors` (required): at least one author with `name`; both `url` and `email` are optional.
  - `url`: primary contact link (personal site, GitHub profile, etc.). Takes priority if present.
  - `email`: fallback contact if `url` is empty or absent. Use empty string `''` if not provided.
  - Rendering: link to `url` if available, otherwise link to `email` using `mailto:`; skip if both are empty.
- `references` (optional): list of references, each with `name` and `url`. Omit the entire field if there are no references.

> Place this frontmatter block at the very top of the Markdown file, wrapped by `---` markers. Start the visible content with an `# Heading` for the article title; a `title` entry in frontmatter is not necessary.

## Editing on GitHub

You only need a GitHub account (sign up via the [GitHub registration page](https://github.com/signup)). Even if you are new to Git, following these steps will let you contribute confidently.

::: tip Reminder
The production site does not change until your PR is merged. Still nervous? Practice with the [GitHub Skills](https://skills.github.com/) tutorials.
:::

### Edit a single page

1. Find the page on the site.
2. Click **Edit this page** in the top-right corner (after reading this guide and the formatting rules) to open the GitHub editor.
3. Update the Markdown content. Disable automatic translation tools to avoid renaming files or altering frontmatter keys.
4. Scroll down, follow the commit convention below, and click **Propose changes**.
5. GitHub will fork the repository automatically and record your commit. Click **Create pull request**, fill out the PR form, and submit.

While waiting for reviews, feel free to comment on other PRs or leave reactions. GitHub will notify you via inbox or email when someone responds.

### Edit multiple pages

1. Open [MHCGA/blog](https://github.com/MHCGA/blog) and press <kbd>.</kbd> (or change `github.com` to `github.dev`) to open the web-based VS Code.
2. Modify multiple files and use the preview button (or <kbd>Ctrl</kbd> + <kbd>K</kbd>, <kbd>V</kbd>) to check rendering.
3. Use the **Source Control** panel, follow the commit convention, and submit. If prompted, create a branch or fork by clicking **Fork Repository**.
4. After committing, follow the on-screen prompts to create a PR: provide a title, target branch, and description, then submit.

### Append changes to an existing PR

1. Open the [Pull Request list](https://github.com/MHCGA/blog/pulls) and find your PR.
2. Under the title you’ll see `<your GitHub ID> wants to merge ... from <branch>`; click the branch name to open your fork.
3. Continue editing:

- A few files: edit directly on GitHub and commit.
- Many files: press <kbd>.</kbd> to reopen the web-based VS Code, then commit.

1. New commits will automatically appear in the PR; there’s no need to create another PR.

## Editing locally with Git

::: warning Recommendation
Prefer the GitHub web editor unless you need GPG-signed commits, custom scripting, or complex local tests; local workflows suit advanced needs.
:::

Steps:

1. Fork `MHCGA/blog` to your account.
2. Clone your fork: `git clone git@github.com:<you>/blog.git`.
3. Create a branch, make your changes, and follow the commit convention.
4. Push to your fork and open a PR on GitHub.
5. To update the PR, keep committing locally and pushing; your PR will update automatically.

Refer to Git best-practice guides if you need more help.

## Previewing build outputs

Every PR triggers GitHub Actions to run lint and build checks. Because the repository does not host preview environments, please verify layout and links locally with `pnpm docs:dev` or `pnpm docs:preview`.

## Navigation & link adjustments

- If you change a published page path/slug, update any manually referenced links (README files, other articles, etc.).
- This repository does not maintain a redirect list. URL changes could create dead links; please note path changes in your PR for maintainers to add redirects at deploy time.

## Frontmatter responsibilities

Keep author and reference metadata accurate during drafting:

- For multi-author articles, include every collaborator in `authors` with their `name`; `url` and `email` are optional.
- The site renders author and reference sections from frontmatter, so maintain them accurately.
- VitePress derives "last updated" from Git history, so you can omit explicit `updatedAt` entries.
- List all referenced materials under `references` with `name` and `url`; omit the field if there are none.
- When editing someone else's article, credit the original author in your PR description.

## Commit convention

```text
<type>(<scope>): <summary>
```

Recommended types:

- `feat`: new content or functionality
- `fix`: corrections to docs/code
- `refactor`: structural changes
- `docs`: documentation or formatting updates
- `revert`: revert a previous commit

Keep the short summary to ~50 characters. Use the body for further details.

## Pull Request convention

1. **Title**: `<type>(<scope>): <summary> (#<issue, optional>)`
2. **Description**: explain what changed and why. Reference issues using `fix #123` when applicable.
3. **Checklist/template**: confirm you read the contribution guide and community rules (Halo community code of conduct).

Examples:

- `fix(en/posts/usage): clarify staged release flow (#42)`
- `feat(posts/plugins): add hot-reload debug guide`
- `docs(contributing): explain commit rules`

## Collaboration flow

1. After opening a PR, reviewers are notified and CI starts.
2. Once GitHub Actions completes, check the action logs below the PR.
3. Reviewers may comment or request changes. If labeled `changes requested`, update the PR as described earlier.
4. At least two reviewers must approve before merge; maintainers may perform a final review for major changes.
5. After merging into `main`, CI rebuilds the site and deploys to production.

## FAQ

- **How do I find reviewers?** Tag frequent reviewers in the PR or request a reviewer in the related issue or community channel.
- **When do I add an English translation?** After the Chinese article merges. Add the translation under `docs/en/` using the same path and mention the translation status in the PR.
- **Where do images belong?** Put assets under `public/` or in an `images/` folder next to the article and reference them with relative paths.

## License

<a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />
Unless otherwise noted, all non-code content in this repository is licensed under the <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/">Creative Commons BY-SA 4.0 International License</a> along with the additional [Star And Thank Author License](https://github.com/zTrix/sata-license).

In short, you are free to share and modify the content as long as you credit the author, share-alike, and do not add further restrictions. Please remember to star the GitHub repo.

When citing this repository, you can use the following BibTeX entry:

```bibtex
@misc{halocmskb,
  author    = {MHCGA},
  title     = {Halo CMS Knowledge Base},
  year      = {2025},
  publisher = {GitHub},
  howpublished = {\url{https://github.com/MHCGA/blog}},
}
```
