---
authors:
  - name: Leo Liu
    url: ''
    email: leo@example.com
references:
  - name: Sample repository
    url: https://github.com/example/halo-plugin-hot-reload
---

# Halo Plugin Hot-Reload Starter

## Motivation

Restarting Halo whenever plugin code changes slows down UI experimentation and API design.

## Approach

- Let Vite serve plugin assets with HMR enabled for instant UI refresh.
- Use the Halo SDK sandbox runtime to avoid repackaging artifacts.
- Start targeted services via `pnpm --filter` to keep resource usage low.

## Steps

1. Add `vite.config.ts` with `server.hmr` enabled inside the plugin package.
2. Point `halo-plugin.yaml` `devServer` to the local Vite URL.
3. Enable Developer Mode inside Halo Admin and attach the sandboxed plugin.
4. Run `pnpm --filter halo-admin dev` to debug frontend and backend together.

## Further Reading

- [Halo Plugin Dev Guide](https://docs.halo.run/developer-guide.html)
- [Vite HMR Docs](https://vitejs.dev/guide/api-hmr.html)
