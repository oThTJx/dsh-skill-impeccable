# @firefly0621/dsh-skill-impeccable

[English](README.md) | 中文

可选的内置 skill（技能）提供方，向 `ctx.skills` 贡献 `impeccable`。内容为 dsh 适配后的 [pbakaus/impeccable](https://github.com/pbakaus/impeccable) 前端设计 skill 树（`skill/SKILL.src.md` 以及 `reference/`、`scripts/`），许可为 Apache-2.0；见 `assets/NOTICE.md` 与 `assets/LICENSE-apache-2.0.txt`。

挂载该插件即可启用提供方。它没有配置。本包不属于官方 main 的 `dsh-base` 组合；请用 `dsh plugin add` 或自定义 `cordis.patch.yml` 显式安装。

该提供方将随包分发的 `skill/` 目录直接作为 skill 资源基底。安装期 `{{…}}` 占位符在提交期由 `scripts/adapt-skill.mjs` 解析（`{{scripts_path}}` 变为 `<skill-base-dir>/scripts`，命令前缀为空，`{{ask_instruction}}` 映射到 `ask_user_question`）。加载时剥掉 `SKILL.src.md` 的安装用 frontmatter，并追加一段简短的 harness 说明。子命令仍以上游 Commands 表为准：在主 skill 正文之后加载对应的 `reference/*.md`。

## 模型体验

通过 `@deepseek-ai/dsh-tool-skill` 间接影响模型；该包会渲染目录条目和所选 skill 的正文。

#### KV Cache 影响

在已挂载时，其目录条目和任何已加载正文都会在各自插入点改变提供方的 KV 前缀。将组合配置行设为 `disabled: true` 可去掉该影响。

## 已知限制与暂缓事项

- 该提供方只贡献一个固定 skill，不提供对命令集的运行时自定义。
- 跨 harness 能力已移除：design-hook 特性与各 harness 的 `<codex>` / `<gemini>` 说明已删除；dsh 用 `detect.mjs` 手动跑 detector。
- 实时浏览器与 detector CLI 工作流仍依赖会话能在用户项目 cwd 下运行随包 Node 脚本。
- 上游同步为手工：拉取新版本后重跑 `scripts/adapt-skill.mjs`，重放该脚本头部列出的手工 dsh 散文适配，再复查 diff。
