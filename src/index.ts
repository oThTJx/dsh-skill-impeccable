/**
 * Bundled `impeccable` skill provider.
 *
 * The packaged `skill/` tree ships pre-adapted: `scripts/adapt-skill.mjs`
 * resolves the install-time `{{…}}` placeholders at commit time, so the provider
 * serves the tree directly with no runtime rewrite.
 *
 * @module @firefly0621/dsh-skill-impeccable
 */

import { accessSync, constants } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Context } from '@deepseek-ai/cordis'
import {
  BUNDLED_SKILL_RANK,
  type SkillCandidate,
  type SkillDefinition,
  type SkillProvider,
} from '@deepseek-ai/dsh-skill'

const PROVIDER_NAME = 'impeccable'
const SKILL_ROOT = fileURLToPath(new URL('../skill/', import.meta.url))
const SKILL_SOURCE = join(SKILL_ROOT, 'SKILL.src.md')
const INVOCATION = { modelInvocable: true, userInvocable: true } as const
/**
 * Upstream skill frontmatter `description`, pinned for catalog stability.
 * The whole string is routing guidance ("Use when…"); also published as `whenToUse`.
 */
const DESCRIPTION = 'Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.'

const DSH_NOTES = `

## DeepSeek Harness notes

- The skill resource base is the packaged \`skill/\` directory (reported in \`<skill_resources>\`); script paths resolve to \`<skill-base-dir>/scripts\` in that tree.
- Prefer \`node <skill-base-dir>/scripts/...\` as written in Setup.
- Slash-command prefixes and Claude allowed-tools frontmatter do not apply; follow Commands by loading the matching \`reference/*.md\`. Call \`ask_user_question\` when the rewritten ask instruction says to clarify.
`

/**
 * Strip install frontmatter and append the dsh harness note.
 * @param raw - `SKILL.src.md` file text, already placeholder-rewritten.
 * @returns model-facing skill body.
 */
export function renderImpeccableSkillBody(raw: string): string {
  return `${stripFrontmatter(raw)}${DSH_NOTES}`
}

/**
 * Drop a leading `---` … `---` frontmatter block when present.
 * @param raw - full skill source text.
 * @returns body after frontmatter, or the original text when none is present.
 */
function stripFrontmatter(raw: string): string {
  if (!raw.startsWith('---')) return raw
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return raw
  return raw.slice(end + '\n---'.length).replace(/^\r?\n/, '')
}

/**
 * Fail loud when the packaged skill source is missing from the installation.
 * @param skillSource - Absolute path to `SKILL.src.md`.
 */
function assertSkillSource(skillSource: string): void {
  try {
    accessSync(skillSource, constants.R_OK)
  } catch {
    throw new Error(
      `@firefly0621/dsh-skill-impeccable: missing packaged skill at ${skillSource}; reinstall this package`,
    )
  }
}

/** Cordis plugin name. */
export const name = 'skill-impeccable'
/** Service required by the bundled provider. */
export const inject = ['skills']

/** Register the bundled `impeccable` provider on `ctx.skills`. */
export function apply(ctx: Context): void {
  assertSkillSource(SKILL_SOURCE)
  const resourceBase = {
    kind: 'directory' as const,
    path: SKILL_ROOT,
  }
  const candidate: SkillCandidate = {
    name: 'impeccable',
    description: DESCRIPTION,
    whenToUse: DESCRIPTION,
    invocation: INVOCATION,
    provider: PROVIDER_NAME,
    source: 'bundled',
    resourceBase,
    rank: BUNDLED_SKILL_RANK,
    locator: SKILL_SOURCE,
  }
  const provider: SkillProvider = {
    name: PROVIDER_NAME,
    list: () => Promise.resolve([candidate]),
    async get(_candidate): Promise<SkillDefinition> {
      const raw = await readFile(SKILL_SOURCE, 'utf8')
      return {
        name: candidate.name,
        description: candidate.description,
        whenToUse: DESCRIPTION,
        invocation: candidate.invocation,
        provider: candidate.provider,
        source: candidate.source,
        resourceBase,
        content: renderImpeccableSkillBody(raw),
      }
    },
  }
  ctx.skills.registerProvider(() => provider)
}
