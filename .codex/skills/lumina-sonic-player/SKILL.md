---
name: lumina-sonic-player
description: Maintain and extend the Lumina Sonic Vue desktop music player in this repository. Use when updating the Academia/Classical music UI, playback state logic, component structure, project documentation, or prototype fidelity.
---

# Lumina Sonic Player

Use this skill when working on this repository's Vue 3 + Vite desktop music player.

## Reference

- Design system: `ui/prop2.md` (Academia / Classical)
- Prior glassmorphism notes: `ui/prop1.md`
- Main views: Discover, Search, Library, Playing

## Architecture

- Keep `src/App.vue` as a thin composition layer.
- Put playback state, search pagination, and controls in `src/composables/usePlayer.ts`.
- Put seed data, copy, image URLs, and shared types in `src/data/music.ts`.
- Put reusable UI in `src/components/music`.
- Put page-level views in `src/components/music/views`.
- Put global styles in `src/styles`; keep `src/style.css` as import-only.
- Centralize design tokens in `src/styles/tokens.css`.

## UI Rules

- Follow Academia/Classical: deep mahogany `#1C1714`, aged oak surfaces `#251E19`, parchment text `#E8DFD4`, polished brass `#C9A962`, crimson sparingly `#8B2635`.
- Typography: Cormorant Garamond for headings, Crimson Pro for body, Cinzel for labels/display; Chinese fallback `Noto Serif SC`.
- Prefer warm wood panels over glass blur; keep subtle paper grain + vignette overlays.
- Signature cues: arch-top covers, sepia-to-color hover, brass interactive states, Volume Roman labels, ornate dividers.
- Keep cards and controls compact for a PC music app workflow.
- Avoid putting all styles or all components into one file.

## Validation

- Run `npm run build` after structural or TypeScript changes.
- Check that Discover, Search, Library, and Playing views still render from `App.vue`.
- Check that play/pause, previous/next, seek, volume, search, search pagination, and like interactions still route through `usePlayer`.
- Search uses `count=20` and `pages`; do not drop pagination when changing the search request.
