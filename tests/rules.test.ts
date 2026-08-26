import { describe, expect, it } from 'vitest'
import { applyRule, compile, fromIpa, ipa } from '../src/engine/rules'

const run = (word: string, rule: string, srcHint?: string[]) =>
  ipa(applyRule(fromIpa(word), compile(rule), srcHint))

describe('rule notation', () => {
  it('rewrites a segment unconditionally', () => {
    expect(run('kat', 'k > x')).toBe('xat')
  })

  it('rewrites every occurrence in one pass', () => {
    expect(run('kak', 'k > x')).toBe('xax')
  })

  it('honours a right environment', () => {
    expect(run('kat', 'a > o / _ t')).toBe('kot')
    expect(run('kap', 'a > o / _ t')).toBe('kap')
  })

  it('honours a left environment', () => {
    expect(run('kat', 'a > o / k _')).toBe('kot')
    expect(run('pat', 'a > o / k _')).toBe('pat')
  })

  it('honours both environments at once', () => {
    expect(run('kat', 'a > o / k _ t')).toBe('kot')
    expect(run('kap', 'a > o / k _ t')).toBe('kap')
  })

  it('matches phoneme classes', () => {
    expect(run('kat', 'V > i')).toBe('kit')
    expect(run('kat', 'C > s')).toBe('sas')
  })

  it('matches inline sets', () => {
    expect(run('kat', '[k p] > s')).toBe('sat')
    expect(run('bat', '[k p] > s')).toBe('bat')
  })

  it('anchors on word boundaries', () => {
    expect(run('kak', 'k > x / # _')).toBe('xak')
    expect(run('kak', 'k > x / _ #')).toBe('kax')
  })

  it('deletes with ∅', () => {
    expect(run('kate', 'e > ∅ / _ #')).toBe('kat')
  })

  it('inserts with ∅ on the left', () => {
    expect(run('kat', '∅ > s / _ #')).toBe('kats')
    expect(run('kat', '∅ > s / # _')).toBe('skat')
  })

  it('expands one segment into several', () => {
    expect(run('nit', 'n > k n / # _')).toBe('knit')
  })

  it('collapses several segments into one', () => {
    expect(run('sikst', 's i k s t > s i k s')).toBe('siks')
  })

  it('echoes a matched segment with %n', () => {
    expect(run('kat', 'V > %1ː')).toBe('kaːt')
  })

  it('echoes across a multi-segment match', () => {
    // vowel + nasal collapses to a long vowel before a fricative
    expect(run('munθ', 'V N > %1ː / _ F')).toBe('muːθ')
  })

  it('does not re-read its own output', () => {
    // Without single-pass semantics this would run away forever.
    expect(run('xxx', 'x > x x')).toBe('xxxxxx')
  })

  it('treats a doubled symbol as one geminate segment', () => {
    // `kk` is West Germanic gemination, not two /k/s, so a `k` rule skips it.
    expect(fromIpa('kka')).toHaveLength(2)
    expect(run('kka', 'k > x')).toBe('kka')
    expect(run('kka', 'kk > k')).toBe('ka')
  })

  it('rejects an unanchored insertion', () => {
    expect(() => compile('∅ > s')).toThrow(/fire everywhere/)
  })

  it('rejects a malformed rule', () => {
    expect(() => compile('k x')).toThrow(/one ">"/)
    expect(() => compile('k > x / a b')).toThrow(/one "_"/)
  })
})

describe('spelling hints', () => {
  const word = [
    { p: 'iː', src: 'ea' },
    { p: 't', src: 't' },
  ]

  it('fires only when the source spelling matches', () => {
    expect(ipa(applyRule(word, compile('iː > eː'), ['ea']))).toBe('eːt')
    expect(ipa(applyRule(word, compile('iː > eː'), ['ee']))).toBe('iːt')
  })

  it('supports a trailing wildcard', () => {
    const silentE = [
      { p: 'n', src: 'ne' },
      { p: 'ɪ', src: 'i' },
    ]
    expect(ipa(applyRule(silentE, compile('n > m'), ['*e']))).toBe('mɪ')
    expect(ipa(applyRule(silentE, compile('ɪ > a'), ['*e']))).toBe('nɪ')
  })

  it('lets an insertion consult its left neighbour', () => {
    const w = [
      { p: 'a', src: 'a' },
      { p: 'n', src: 'ne' },
    ]
    expect(ipa(applyRule(w, compile('∅ > ə / C _ #'), ['*e']))).toBe('anə')

    const noE = [
      { p: 'a', src: 'a' },
      { p: 'n', src: 'n' },
    ]
    expect(ipa(applyRule(noE, compile('∅ > ə / C _ #'), ['*e']))).toBe('an')
  })
})
