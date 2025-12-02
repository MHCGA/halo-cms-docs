---
authors:
  - name: Nan Qin
    url: ''
    email: nan.qin@example.com
references:
  - name: Automation repository
    url: https://github.com/example/halo-release-pipeline
---

# Staged Release Pipeline for Halo Content

## Scenario

Marketing teams need to preview Halo articles, run compliance checks, and push approved content live with minimal manual steps.

## Architecture

1. Listen to the `content:publish` webhook once reviewers approve an article.
2. Have GitHub Actions pull Markdown, run `pnpm lint:content`, and bundle assets.
3. Deploy to preview or production buckets based on the `stage:*` label.

## Implementation Steps

- Create three Halo webhooks for draft, preview, and rollback events.
- Run `pnpm --filter docs build` to generate static files for both stages.
- Use Cloudflare Workers to route `/preview` traffic to the preview bucket.

## Lessons Learned

- Share the same CDN domain to avoid CORS issues.
- Mirror approval logs into the Halo audit center for traceability.
- Notify Slack channels via the `slack-notify` action once deployments finish.
