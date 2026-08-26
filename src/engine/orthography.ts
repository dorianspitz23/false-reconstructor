/**
 * Renders a phoneme string in each stage's own conventional orthography.
 *
 * These are not transcriptions — they are the spellings each tradition actually
 * uses. Old English gets its macrons, thorns and ash; Proto-Germanic gets the
 * Wiktionary-standard `*stainaz` shape; Proto-Indo-European gets laryngeals,
 * the three-way dorsal contrast and an acute accent.
 */

import { isVowel } from './phonology'
import type { Word } from './types'

type Table = Record<string, string>

/** Apply a table segment by segment, falling back to the IPA symbol itself. */
function render(word: Word, table: Table, opts: { srcAware?: Table } = {}): string {
  return word
    .map((seg) => {
      if (opts.srcAware) {
        const keyed = opts.srcAware[`${seg.p}|${seg.src}`]
        if (keyed !== undefined) return keyed
      }
      return table[seg.p] ?? seg.p
    })
    .join('')
}

// The Modern English form is not spelled from phonemes — it is whatever the
// user typed, which `reconstruct` passes through verbatim.

// --------------------------------------------------------------------------
// Early Modern English, c. 1600
// --------------------------------------------------------------------------

const EMOD: Table = {
  əi: 'i', əu: 'ou', iː: 'ee', eː: 'ee', ɛː: 'ea', aː: 'aa', ɔː: 'oa', oː: 'oo', uː: 'ou',
  æ: 'a', a: 'a', ɛ: 'e', ɪ: 'i', ɒ: 'o', ʊ: 'u', ʌ: 'u', ə: 'e', ɜ: 'e', i: 'i', u: 'u',
  e: 'e', o: 'o', ɔ: 'o', ɑ: 'a', y: 'u',
  θ: 'th', ð: 'th', ʃ: 'sh', ʒ: 's', tʃ: 'ch', dʒ: 'dg', x: 'gh', ŋ: 'ng',
  k: 'k', ɡ: 'g', j: 'y', w: 'w', h: 'h', v: 'v', z: 's',
}

const EMOD_SRC: Table = {
  'iː|ea': 'ea', 'iː|ee': 'ee', 'ɜ|er': 'er', 'ɜ|ir': 'ir', 'ɜ|ur': 'ur',
  'k|c': 'c', 'k|ck': 'ck', 'k|ch': 'ch', 's|c': 'c', 'ɪ|y': 'y', 'i|y': 'y',
  'uː|oo': 'oo', 'oː|oo': 'oo', 'oː|oa': 'oa',
}

export function spellEarlyModern(word: Word): string {
  const base = render(word, EMOD, { srcAware: EMOD_SRC })
  // Early Modern printers kept the etymological final -e, but only on words
  // that had one — `stoone` yes, `shipe` no.
  const last = word[word.length - 1]
  const wantsE = !!last && last.src.length > 1 && last.src.endsWith('e')
  return wantsE && !/e$/.test(base) ? base + 'e' : base
}

// --------------------------------------------------------------------------
// Middle English, c. 1400
// --------------------------------------------------------------------------

const MIDDLE: Table = {
  iː: 'i', yː: 'u', eː: 'ee', ɛː: 'e', aː: 'a', ɔː: 'oo', oː: 'oo', uː: 'ou',
  a: 'a', ɛ: 'e', e: 'e', ɪ: 'i', i: 'i', ɔ: 'o', o: 'o', ʊ: 'u', u: 'u', ə: 'e', y: 'u',
  ai: 'ai', au: 'au', ɔi: 'oi', ou: 'ou', ei: 'ei', iu: 'ew',
  θ: 'th', ð: 'th', ʃ: 'sch', tʃ: 'ch', dʒ: 'gg', x: 'gh', ŋ: 'ng',
  k: 'k', ɡ: 'g', j: 'y', w: 'w', h: 'h', v: 'v', z: 's', ʒ: 'g',
}

const MIDDLE_SRC: Table = { 'k|c': 'c', 'k|ck': 'k', 'k|ch': 'ch', 's|c': 'c', 'kw|qu': 'qu' }

export function spellMiddle(word: Word): string {
  return render(word, MIDDLE, { srcAware: MIDDLE_SRC })
}

// --------------------------------------------------------------------------
// Old English, c. 900
// --------------------------------------------------------------------------

const OLD_ENGLISH: Table = {
  æ: 'æ', æː: 'ǣ', a: 'a', aː: 'ā', e: 'e', eː: 'ē', i: 'i', iː: 'ī',
  o: 'o', oː: 'ō', u: 'u', uː: 'ū', y: 'y', yː: 'ȳ', ø: 'œ', øː: 'œ̄',
  æa: 'ea', eo: 'eo', ie: 'ie', ə: 'e', ɛ: 'e', ɪ: 'i', ʊ: 'u', ɔ: 'o',
  θ: 'þ', ð: 'ð', x: 'h', ɣ: 'g', v: 'f', z: 's',
  tʃ: 'ċ', dʒ: 'ċġ', ʃ: 'sc', j: 'ġ', k: 'c', ɡ: 'g', kʷ: 'cw', ŋ: 'n',
  w: 'w', h: 'h', f: 'f', s: 's', m: 'm', n: 'n', l: 'l', r: 'r',
  p: 'p', b: 'b', t: 't', d: 'd',
}

export function spellOldEnglish(word: Word): string {
  // Old English wrote `sc` for /ʃ/ and doubled nothing word-finally.
  return render(word, OLD_ENGLISH)
}

// --------------------------------------------------------------------------
// Proto-West Germanic, c. 400 — reconstructed
// --------------------------------------------------------------------------

const PWG: Table = {
  a: 'a', aː: 'ā', e: 'e', eː: 'ē', i: 'i', iː: 'ī', o: 'o', oː: 'ō', u: 'u', uː: 'ū',
  ai: 'ai', au: 'au', eu: 'eu', iu: 'iu', æ: 'a', ə: 'a',
  θ: 'þ', ð: 'd', β: 'b', ɣ: 'g', x: 'h', xʷ: 'hw', kʷ: 'kw', ɡʷ: 'gw',
  k: 'k', ɡ: 'g', j: 'j', w: 'w', v: 'b', ʃ: 'sk', tʃ: 'k', dʒ: 'g',
  // Written *z, per the standard Proto-West-Germanic convention. The derivation
  // itself turns /z/ into /s/, so this only surfaces on the rhotacism gloss —
  // where rendering it as `s` would contradict the note beside it.
  z: 'z',
  ll: 'll', mm: 'mm', nn: 'nn', pp: 'pp', tt: 'tt', kk: 'kk', ss: 'ss', rr: 'rr',
  bb: 'bb', dd: 'dd', ɡɡ: 'gg',
}

export function spellProtoWestGermanic(word: Word): string {
  return render(word, PWG)
}

// --------------------------------------------------------------------------
// Proto-Germanic, c. 1 CE — reconstructed
// --------------------------------------------------------------------------

const PG: Table = {
  a: 'a', aː: 'ā', e: 'e', eː: 'ē', i: 'i', iː: 'ī', o: 'o', oː: 'ō', u: 'u', uː: 'ū',
  ai: 'ai', au: 'au', eu: 'eu', iu: 'iu', æ: 'a', ə: 'a',
  θ: 'þ', ð: 'd', β: 'b', ɣ: 'g', x: 'h', xʷ: 'hw', kʷ: 'kw', ɡʷ: 'gw',
  k: 'k', ɡ: 'g', j: 'j', w: 'w', z: 'z', v: 'b', ʃ: 'sk',
  ll: 'll', mm: 'mm', nn: 'nn', pp: 'pp', tt: 'tt', kk: 'kk', ss: 'ss', rr: 'rr',
}

export function spellProtoGermanic(word: Word): string {
  return render(word, PG)
}

// --------------------------------------------------------------------------
// Proto-Indo-European — reconstructed
// --------------------------------------------------------------------------

const PIE: Table = {
  a: 'a', aː: 'ā', e: 'e', eː: 'ē', i: 'i', iː: 'ī', o: 'o', oː: 'ō', u: 'u', uː: 'ū',
  ai: 'ai', au: 'au', eu: 'eu', ei: 'ei', oi: 'oi', ou: 'ou',
  bʰ: 'bʰ', dʰ: 'dʰ', ɡʰ: 'gʰ', ɡʷʰ: 'gʷʰ', gʷʰ: 'gʷʰ',
  kʷ: 'kʷ', ɡʷ: 'gʷ', gʷ: 'gʷ',
  p: 'p', t: 't', k: 'k', b: 'b', d: 'd', ɡ: 'g', s: 's',
  m: 'm', n: 'n', l: 'l', r: 'r', j: 'y', w: 'w',
  'm̩': 'm̥', 'n̩': 'n̥', 'l̩': 'l̥', 'r̩': 'r̥',
  // Subscript digits are not valid in a bare JS key, so these stay quoted.
  'h₁': 'h₁', 'h₂': 'h₂', 'h₃': 'h₃',
}

const ACUTE: Table = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', ā: 'ā́', ē: 'ḗ', ī: 'ī́', ō: 'ṓ', ū: 'ū́' }

export function spellPie(word: Word): string {
  const base = render(word, PIE)
  return accentFirstVowel(base) + '-'
}

/**
 * Mark the accent on the first vowel. Proto-Indo-European accent was mobile and
 * a nonce root gives no evidence for where it sat, so root-initial is the
 * conventional citation choice — and the alternative is surfaced separately as
 * the Verner's Law ambiguity.
 */
function accentFirstVowel(s: string): string {
  for (let i = 0; i < s.length; i += 1) {
    const marked = ACUTE[s[i]!]
    if (marked) return s.slice(0, i) + marked + s.slice(i + 1)
  }
  return s
}

// --------------------------------------------------------------------------
// Romance branch
// --------------------------------------------------------------------------

const OLD_FRENCH: Table = {
  a: 'a', e: 'e', ɛ: 'e', i: 'i', o: 'o', ɔ: 'o', u: 'ou', y: 'u', ø: 'eu', ə: 'e',
  aː: 'a', eː: 'e', iː: 'i', oː: 'o', uː: 'ou',
  je: 'ie', wɔ: 'ue', ai: 'ai', ei: 'ei', ou: 'ou', au: 'au',
  tʃ: 'ch', dʒ: 'j', ʃ: 'ss', ʒ: 'g', ts: 'z', k: 'c', ɡ: 'g', kʷ: 'qu',
  θ: 't', ð: 'd', j: 'i', w: 'v', ɲ: 'gn', ʎ: 'ill', z: 's', v: 'v', ŋ: 'n',
}

export function spellOldFrench(word: Word): string {
  return render(word, OLD_FRENCH)
}

const LATIN: Table = {
  a: 'a', aː: 'ā', e: 'e', eː: 'ē', i: 'i', iː: 'ī', o: 'o', oː: 'ō', u: 'u', uː: 'ū',
  y: 'y', ɛ: 'e', ɔ: 'o', ə: 'e', ai: 'ae', au: 'au', oi: 'oe', ei: 'ei',
  k: 'c', kʷ: 'qu', ɡ: 'g', ɡʷ: 'gu', j: 'i', w: 'v', θ: 'th', ʃ: 's', tʃ: 'c',
  dʒ: 'g', ʒ: 'i', z: 's', v: 'v', ŋ: 'n', x: 'h', ts: 't',
}

export function spellLatin(word: Word): string {
  return render(word, LATIN)
}

const PROTO_ITALIC: Table = {
  ...LATIN,
  k: 'k', kʷ: 'kʷ', w: 'w', j: 'j', θ: 'þ', x: 'χ', f: 'f', ɸ: 'f',
}

export function spellProtoItalic(word: Word): string {
  return render(word, PROTO_ITALIC)
}

/** Broad IPA for display, with syllable-boundary-free slashes added by the UI. */
export function toIpa(word: Word): string {
  return word.map((s) => s.p).join('')
}

/** True if the word has at least one vowel — used to sanity-check output. */
export function hasVowel(word: Word): boolean {
  return word.some((s) => isVowel(s.p))
}
