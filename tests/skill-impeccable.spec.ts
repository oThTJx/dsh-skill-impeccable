import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it } from 'vitest'
import SkillRegistry from '@deepseek-ai/dsh-skill'
import * as SkillImpeccable from '@firefly0621/dsh-skill-impeccable'
import { renderImpeccableSkillBody } from '@firefly0621/dsh-skill-impeccable'

const SKILL_ROOT = fileURLToPath(new URL('../skill/', import.meta.url))

describe('dsh-skill-impeccable', () => {
  it('registers and disposes the bundled impeccable skill against the packaged skill tree', async () => {
    const ctx = new Context()
    await ctx.plugin(SkillRegistry)
    const fiber = await ctx.plugin(SkillImpeccable)

    const listed = await ctx.skills.list()
    expect(listed).toHaveLength(1)
    const candidate = listed[0]
    if (candidate === undefined) throw new Error('expected impeccable candidate')
    expect(candidate).toMatchObject({
      name: 'impeccable',
      provider: 'impeccable',
      source: 'bundled',
      invocation: { modelInvocable: true, userInvocable: true },
      resourceBase: { kind: 'directory', path: SKILL_ROOT },
    })
    expect(candidate.whenToUse).toMatch(/^Use when the user wants to design/)
    expect(candidate.whenToUse).toBe(candidate.description)

    const loaded = await ctx.skills.get('impeccable')
    expect(loaded?.content).toContain('## Setup')
    expect(loaded?.content).toContain('## DeepSeek Harness notes')
    expect(loaded?.content).not.toContain('{{scripts_path}}')
    expect(loaded?.content).not.toContain('{{command_prefix}}')
    expect(loaded?.resourceBase).toEqual({ kind: 'directory', path: SKILL_ROOT })

    await fiber.dispose()
    expect(await ctx.skills.list()).toEqual([])
  })

  it('ships a tree with no leftover install placeholders', () => {
    const forbidden = /\{\{(?:model|config_file|ask_instruction|command_prefix|available_commands|command_hint|scripts_path)\}\}/
    const offenders: string[] = []
    for (const absolute of listFiles(SKILL_ROOT)) {
      if (forbidden.test(readFileSync(absolute, 'utf8'))) offenders.push(absolute)
    }
    expect(offenders).toEqual([])
  })

  it('rewrites the packaged provider markers to the dsh values', () => {
    const provider = readFileSync(join(SKILL_ROOT, 'scripts', 'lib', 'provider.mjs'), 'utf8')
    expect(provider).toContain('export const IMPECCABLE_COMMAND_PREFIX = "";')
    expect(provider).toContain('export const IMPECCABLE_PROVIDER_ID = "dsh";')
  })

  it('strips install frontmatter and appends the harness note', () => {
    const rendered = renderImpeccableSkillBody('---\nname: impeccable\n---\nbody\n')
    expect(rendered).toContain('body')
    expect(rendered).toContain('## DeepSeek Harness notes')
    expect(rendered).not.toContain('name: impeccable')
  })
})

function listFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const absolute = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(absolute))
    else out.push(absolute)
  }
  return out
}
