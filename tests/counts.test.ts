import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { G2P_RULE_COUNT, reconstruct, SOUND_CHANGE_COUNT, stagesFor } from '../src/engine'

/**
 * Claims the project makes about itself, checked against the thing it is
 * describing.
 *
 * The rule count went stale three times in a single afternoon — once per rule
 * added — because it lived in prose while the ruleset lived in code, and
 * nothing connected the two. The social card has the same exposure: it is a
 * hand-built file rendered to a PNG, and it is the first thing anyone sees when
 * the link is shared, so a stale derivation on it is a wrong answer with a wide
 * audience and no reader.
 *
 * Every check here fails loudly the moment the code moves and the copy does
 * not, which is the only reliable way a number in prose stays true.
 */
const read = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')

describe('the project’s claims about itself', () => {
  it('is a plausible number in the first place', () => {
    // Guards against the derivation silently returning 0 and every check below
    // passing against an empty ruleset.
    expect(SOUND_CHANGE_COUNT).toBeGreaterThan(100)
  })

  it('matches the README', () => {
    const readme = read('README.md')
    const sound = readme.match(/So this is a table\. (\d+) of them/)?.[1]
    expect(sound, 'README no longer states the count in the expected sentence').toBeDefined()
    expect(Number(sound)).toBe(SOUND_CHANGE_COUNT)

    const g2p = readme.match(/plus (\d+) rules for turning spelling into sound/)?.[1]
    expect(g2p, 'README no longer states the grapheme rule count').toBeDefined()
    expect(Number(g2p)).toBe(G2P_RULE_COUNT)
  })

  it('matches the social card', () => {
    const card = read('scripts/social-card.html')
    const quoted = card.match(/(\d+) real sound laws/)?.[1]
    expect(quoted, 'social card no longer states the count').toBeDefined()
    expect(Number(quoted)).toBe(SOUND_CHANGE_COUNT)
  })

  it('matches the derivation printed on the social card', () => {
    // The card is a hand-built HTML file rendered to a PNG, and it is the first
    // thing anyone sees when the link is shared. A sound-change edit that moves
    // `flarn` would leave it advertising a derivation the engine no longer
    // produces, with nothing to notice but someone's eye.
    const card = read('scripts/social-card.html')
    const printed = [...card.matchAll(/<div class="form">.*?¶<\/span>(.*?)<\/div>/gs)].map((m) =>
      m[1]!.replace(/<[^>]+>/g, '').trim(),
    )
    expect(printed.length, 'card no longer lists forms in the expected shape').toBe(4)

    const derived = reconstruct('flarn').stages
    const wanted = ['today', 'c. 900', 'c. 1 CE', 'c. 4000 BC'].map(
      (period) => derived.find((s) => s.stage.period === period)!.form,
    )
    expect(printed).toEqual(wanted)
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
