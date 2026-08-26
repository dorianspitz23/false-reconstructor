import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { reconstruct } from '../src/engine'

/*
 * The fonts are vendored as subsets, so a character outside every declared
 * unicode-range does not fail loudly — the browser quietly draws it from a
 * system font instead. Mid-word that reads as a wrong typeface, and on a
 * combining mark it reads as a broken one: the acute in a PIE form sat beside
 * its vowel rather than over it, because a different face was drawing it.
 *
 * So: everything the app can put on screen has to be covered by something in
 * src/fonts.css. When a new sound law introduces a symbol, this fails and
 * scripts/fetch-fonts.mjs needs the character adding to SUPPLEMENT.
 */

const RANGES: [number, number][] = []
for (const m of readFileSync('src/fonts.css', 'utf8').matchAll(/unicode-range:([^;]+);/g)) {
  for (const part of (m[1] ?? '').split(',')) {
    const [lo, hi] = part.trim().replace(/^U\+/i, '').split('-')
    if (lo) RANGES.push([parseInt(lo, 16), parseInt(hi ?? lo, 16)])
  }
}

const covered = (cp: number) => RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)

/** Deterministic nonsense words, so the sweep is wide but the run is stable. */
function coinedWords(count: number): string[] {
  const CONS = 'bcdfghjklmnprstvwxyz'
  const VOW = 'aeiou'
  let seed = 20260826
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff
  const out: string[] = []
  for (let i = 0; i < count; i++) {
    let w = ''
    for (let s = 0; s < 2 + Math.floor(next() * 2); s++) {
      w += CONS[Math.floor(next() * CONS.length)]! + VOW[Math.floor(next() * VOW.length)]!
      if (next() > 0.6) w += CONS[Math.floor(next() * CONS.length)]!
    }
    out.push(w)
  }
  return out
}

describe('every character the app renders has a font that covers it', () => {
  it('covers all of it, across both lineages', () => {
    const REAL = ['nation', 'mount', 'heart', 'knight', 'ship', 'foot', 'stone', 'mouse',
      'father', 'three', 'brother', 'stark', 'city', 'river', 'flower', 'rule', 'form',
      'cure', 'pure', 'part', 'art', 'table', 'port', 'chant', 'trible', 'prolation']

    // Where each uncovered codepoint first appeared, so a failure names the rule.
    const missing = new Map<number, string>()
    const scan = (text: string, where: string) => {
      for (const ch of text ?? '') {
        const cp = ch.codePointAt(0)
        if (cp !== undefined && !covered(cp) && !missing.has(cp)) missing.set(cp, where)
      }
    }

    for (const word of [...REAL, ...coinedWords(400)]) {
      for (const lineage of ['germanic', 'romance'] as const) {
        for (const s of reconstruct(word, lineage).stages) {
          const at = `${word} (${lineage}) at ${s.stage.id}`
          scan(s.form, `${at}: ${s.form}`)
          scan(s.ipa, `${at}: /${s.ipa}/`)
          for (const a of s.ambiguities) {
            scan(a.alternative, `${at}: alternative ${a.alternative}`)
            scan(a.reason, `${at}: the "${a.name}" note`)
          }
          for (const c of s.applied) {
            scan(c.note ?? '', `${at}: the "${c.name}" note`)
            scan(c.before, at)
            scan(c.after, at)
          }
        }
      }
    }

    const report = [...missing.entries()]
      .map(([cp, where]) =>
        `U+${cp.toString(16).toUpperCase().padStart(4, '0')} "${String.fromCodePoint(cp)}" — ${where}`,
      )
      .join('\n')

    expect(report, `no @font-face covers:\n${report}\nAdd them to SUPPLEMENT in scripts/fetch-fonts.mjs`).toBe('')
  })
})
