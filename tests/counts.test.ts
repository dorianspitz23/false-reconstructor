import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SOUND_CHANGE_COUNT, stagesFor } from '../src/engine'

/**
 * The rule count is quoted in prose in three places. The app derives its own
 * from the ruleset, but the README and the social card are written by hand and
 * went stale three times in a single afternoon — once per rule added — because
 * nothing connected the sentence to the thing it described.
 *
 * This connects them. Add a sound change and these fail until the copy is
 * updated, which is the only reliable way a number in prose stays true.
 */
const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

describe('the quoted rule count matches the ruleset', () => {
  it('is a plausible number in the first place', () => {
    // Guards against the derivation silently returning 0 and every check below
    // passing against an empty ruleset.
    expect(SOUND_CHANGE_COUNT).toBeGreaterThan(100)
  })

  it('matches the README', () => {
    const readme = read('README.md')
    const quoted = readme.match(/So this is a table\. (\d+) of them/)?.[1]
    expect(quoted, 'README no longer states the count in the expected sentence').toBeDefined()
    expect(Number(quoted)).toBe(SOUND_CHANGE_COUNT)
  })

  it('matches the social card', () => {
    const card = read('scripts/social-card.html')
    const quoted = card.match(/(\d+) real sound laws/)?.[1]
    expect(quoted, 'social card no longer states the count').toBeDefined()
    expect(Number(quoted)).toBe(SOUND_CHANGE_COUNT)
  })

  it('has no duplicate change ids inside a stage', () => {
    // The derivation dedupes on `stage:id`, so a copy-pasted id within one
    // stage would silently shrink the count instead of announcing itself.
    // Checked against the real stage objects — a text scan cannot tell a
    // sound-change id from a stage id, and `pie` is legitimately both chains'
    // last stage.
    for (const lineage of ['germanic', 'romance'] as const) {
      for (const stage of stagesFor(lineage)) {
        const ids = stage.changes.map((c) => c.id)
        expect(new Set(ids).size, `${stage.id} has a repeated change id`).toBe(ids.length)
      }
    }
  })

  it('gives every change a rule or an apply, never neither', () => {
    for (const lineage of ['germanic', 'romance'] as const) {
      for (const stage of stagesFor(lineage)) {
        for (const c of stage.changes) {
          expect(c.rule ?? c.apply, `${stage.id}:${c.id} has no rule`).toBeDefined()
        }
      }
    }
  })
})
