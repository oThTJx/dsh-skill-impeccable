/**
 * Commit-time dsh adaptation for the packaged `skill/` tree.
 *
 * Re-run after pulling a newer upstream impeccable release, then review the diff:
 *   node scripts/adapt-skill.mjs
 *
 * Resolves every install-time `{{…}}` placeholder in the committed tree so the
 * provider serves pre-adapted content with no runtime rewrite. `{{scripts_path}}`
 * becomes `<skill-base-dir>/scripts`, which the skill body already defines as the
 * base directory the runtime reports for the skill.
 *
 * On top of the placeholder rewrite, dsh adaptations applied by hand (not by this
 * script) and re-applied after an upstream pull:
 * - `reference/new-work.md` and `reference/visualize.md`: shipped agents dispatched
 *   as dsh `subagent`s instead of per-harness named agents.
 * - `reference/live.md`: poll runs as a dsh background job; no Codex/Cursor policy.
 * - Design-hook feature removed: `reference/hooks.md`, `scripts/hook*.mjs`, and the
 *   `SKILL.src.md` Hooks line deleted; dsh runs `detect.mjs` manually.
 * - `<codex>`/`<gemini>` blocks removed (critique, live, asset-producer) or unwrapped
 *   (craft-floor keeps the general rules, drops the tags).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../skill', import.meta.url))

const SUB_COMMANDS = [
  'adapt', 'animate', 'audit', 'bolder', 'clarify', 'colorize', 'critique',
  'delight', 'distill', 'document', 'harden', 'layout', 'onboard', 'optimize',
  'overdrive', 'polish', 'quieter', 'shape', 'typeset',
]
const SLASH_NAMES = ['impeccable', ...SUB_COMMANDS]

const PLACEHOLDERS = {
  model: 'the model',
  config_file: 'AGENTS.md',
  ask_instruction: 'STOP and call the `ask_user_question` tool to clarify.',
  command_prefix: '',
  available_commands: SUB_COMMANDS.map((name) => `impeccable ${name}`).join(', '),
  command_hint: 'command',
  scripts_path: '<skill-base-dir>/scripts',
}

const PROVIDER_PREFIX_MARKER =
  "export const IMPECCABLE_COMMAND_PREFIX = '/'; // @impeccable-provider-command-prefix"
const PROVIDER_ID_MARKER =
  "export const IMPECCABLE_PROVIDER_ID = 'source'; // @impeccable-provider-id"

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function rewriteMarkdown(content) {
  let result = content
    .replaceAll('{{model}}', PLACEHOLDERS.model)
    .replaceAll('{{config_file}}', PLACEHOLDERS.config_file)
    .replaceAll('{{ask_instruction}}', PLACEHOLDERS.ask_instruction)
    .replaceAll('{{command_prefix}}', PLACEHOLDERS.command_prefix)
    .replaceAll('{{available_commands}}', PLACEHOLDERS.available_commands)
    .replaceAll('{{command_hint}}', PLACEHOLDERS.command_hint)
    .replaceAll('{{scripts_path}}', PLACEHOLDERS.scripts_path)
  for (const name of [...SLASH_NAMES].sort((a, b) => b.length - a.length)) {
    result = result.replace(
      new RegExp(`(?<![a-zA-Z0-9_./-])\\/(?=${escapeRegex(name)}(?:[^a-zA-Z0-9_-]|$))`, 'g'),
      PLACEHOLDERS.command_prefix,
    )
  }
  return result
}

function rewriteProviderScript(content) {
  return content
    .replace(PROVIDER_PREFIX_MARKER, 'export const IMPECCABLE_COMMAND_PREFIX = "";')
    .replace(PROVIDER_ID_MARKER, 'export const IMPECCABLE_PROVIDER_ID = "dsh";')
}

function rewriteInstructions(content) {
  const body = content.replaceAll("scriptsPath = '{{scripts_path}}'", 'scriptsPath = SCRIPTS_DIR')
  return [
    "import { fileURLToPath } from 'node:url'",
    '',
    "const SCRIPTS_DIR = fileURLToPath(new URL('..', import.meta.url))",
    '',
    body,
  ].join('\n')
}

function listFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry)
    if (statSync(absolute).isDirectory()) out.push(...listFiles(absolute))
    else out.push(absolute)
  }
  return out
}

let changed = 0
for (const absolute of listFiles(ROOT)) {
  const posix = absolute.replaceAll('\\', '/')
  const raw = readFileSync(absolute, 'utf8')
  let next
  if (posix.endsWith('.md')) next = rewriteMarkdown(raw)
  else if (posix.endsWith('/scripts/lib/provider.mjs')) next = rewriteProviderScript(raw)
  else if (posix.endsWith('/scripts/live/instructions.mjs')) next = rewriteInstructions(raw)
  else continue
  if (next !== raw) {
    writeFileSync(absolute, next)
    changed += 1
  }
}
console.log(`adapted ${changed} files under ${ROOT}`)
