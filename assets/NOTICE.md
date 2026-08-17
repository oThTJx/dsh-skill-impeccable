# Third-party notice

This package ships skill content adapted from [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (commit `7b646baf`, v3.6.0) under the Apache License 2.0.

Adaptation for DeepSeek Harness: the install-time `{{…}}` placeholders in the packaged `skill/` tree are resolved at commit time by `scripts/adapt-skill.mjs` (`{{scripts_path}}` becomes `<skill-base-dir>/scripts`, the command prefix is empty, `{{ask_instruction}}` maps to the `ask_user_question` tool, and the provider marker scripts set the dsh provider id). The full Apache License 2.0 text ships at `assets/LICENSE-apache-2.0.txt`.

The upstream `skill/reference/ios.md` and `skill/reference/android.md` files are distilled from ehmo's [platform-design-skills](https://github.com/ehmo/platform-design-skills) (Apple Human Interface Guidelines and Material Design 3 rules), rewritten in Impeccable's voice, under the MIT License, author ehmo.
