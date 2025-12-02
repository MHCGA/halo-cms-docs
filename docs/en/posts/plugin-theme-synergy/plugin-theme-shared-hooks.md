---
authors:
  - name: Lin You
    url: ''
    email: lin.you@example.com
  - name: Wen He
    url: ''
    email: he.wen@example.com
references:
  - name: Practice Guide
    url: https://howiehz.top/mhcga/extensions-hooks
---

# Sharing Hooks Between Plugins and Themes

## Context

Multilingual themes often need plugin-owned metadata, while plugins need layout state from the theme. Direct REST calls increase coupling and error handling.

## Collaboration Model

1. Reserve the `plugin.theme.*` namespace for events that themes can subscribe to.
2. Emit DTOs through the Halo event bus with a lightweight `server-extension` module.
3. Inside the theme, call `Halo.eventBus.subscribe` and map payloads to template variables.

## Implementation Notes

- Document hook names in `extension.yaml` so contributors can rely on them.
- Validate payloads with JSON Schema to keep both sides in sync.
- Wrap async listeners with `AbortController` to prevent triggers after the theme unmounts.

## References

- [Event-driven Halo Plugin](https://github.com/halo-dev)
- [Theme ↔ Plugin Contract Sample](https://gist.github.com/example/abc123)
