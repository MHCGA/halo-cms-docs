---
authors:
  - name: Shan Zhao
    url: ''
    email: shan.zhao@example.com
references:
  - name: Reference article
    url: https://blog.example.com/halo-theme-responsive
---

# Responsive Theme Blueprint and Style Layers

## Goals

Maintain a unified experience across devices and brands while allowing rapid tweaks to color palettes and density.

## Layered Strategy

- **Design Tokens**: Store color, spacing, and typography in JSON, then sync to Less and CSS variables.
- **Layout Layer**: Keep `layouts/*.ftl` purely structural with no hard-coded colors or fonts.
- **Component Layer**: Break complex widgets into reusable macros for selective overrides.

## Validation Checklist

1. Run `pnpm docs:dev` with the sample theme and enable the mobile preview toggle.
2. Use Chrome DevTools device mode to inspect common breakpoints.
3. Add Playwright tests to cover navigation, search, and comment flows.

## Resources

- [Halo Theme Guide](https://docs.halo.run/theme-guide.html)
- [Design Token W3C Draft](https://design-tokens.github.io/community-group/format/)
