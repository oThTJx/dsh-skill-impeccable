# @firefly0621/dsh-skill-impeccable

English | [中文](README.zh.md)

Optional bundled skill provider that contributes `impeccable` to `ctx.skills`. The skill is the dsh-adapted [pbakaus/impeccable](https://github.com/pbakaus/impeccable) frontend-design skill tree (`skill/SKILL.src.md` plus `reference/` and `scripts/`), Apache-2.0; see `assets/NOTICE.md` and `assets/LICENSE-apache-2.0.txt`.

Mount the plugin to enable the provider. It has no configuration. This package is not part of the official main `dsh-base` composition; install it explicitly with `dsh plugin add` or a custom `cordis.patch.yml`.

The provider serves the packaged `skill/` directory directly as the skill resource base. The install-time `{{…}}` placeholders are resolved at commit time by `scripts/adapt-skill.mjs` (`{{scripts_path}}` becomes `<skill-base-dir>/scripts`, the command prefix is empty, and `{{ask_instruction}}` maps to `ask_user_question`). On load it strips install frontmatter from `SKILL.src.md` and appends a short harness note. Sub-commands remain the upstream Commands table: load the matching `reference/*.md` after the main skill body.

## Model Experience

Indirectly, through `@deepseek-ai/dsh-tool-skill`, which renders the catalog entry and selected skill body.

#### KV Cache effect

When mounted, its catalog entry and any loaded body change the provider KV prefix at their insertion points. Setting the composition row to `disabled: true` removes that effect.

## Known Limitations and Deferred Work

- The provider contributes one fixed skill and has no runtime customization of the command set.
- Cross-harness capability is removed: the design-hook feature and the per-harness `<codex>` / `<gemini>` notes are dropped; dsh runs the detector manually with `detect.mjs`.
- Live-browser and detector CLI workflows still depend on the session being able to run the packaged Node scripts against the user project cwd.
- Upstream sync is manual: re-run `scripts/adapt-skill.mjs` after pulling a newer release, re-apply the hand dsh prose adaptations listed in that script's header, then review the diff.
