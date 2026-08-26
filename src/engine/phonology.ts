/**
 * Phoneme inventory and feature classes.
 *
 * The inventory is the union of every symbol used anywhere in the pipeline, from
 * Modern English through to Proto-Indo-European. It exists so that IPA strings
 * can be tokenised unambiguously: `tʃ` is one segment, not `t` + `ʃ`.
 */

/** Multi-character segments, matched greedily before single characters. */
const MULTICHAR = [
  // affricates and labiovelars
  'tʃ', 'dʒ', 'kʷ', 'gʷ', 'ɡʷ', 'xʷ', 'ɣʷ', 'hʷ', 'gʷʰ', 'ɡʷʰ',
  // aspirates (PIE)
  'bʰ', 'dʰ', 'gʰ', 'ɡʰ', 'ǵʰ',
  // long vowels
  'iː', 'yː', 'eː', 'øː', 'ɛː', 'æː', 'aː', 'ɑː', 'ɔː', 'oː', 'uː', 'ɜː',
  // diphthongs
  'aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'əi', 'əu', 'ai', 'au', 'eu', 'iu', 'ie',
  'æa', 'eo', 'ea', 'ei', 'oi', 'ou', 'ui', 'wɔ', 'je', 'wa',
  // Old English long diphthongs (ēa, ēo, īe) — listed before their short
  // counterparts by the length sort, so they tokenise as one segment
  'æaː', 'eoː', 'ieː',
  // long consonants (West Germanic gemination)
  'll', 'mm', 'nn', 'pp', 'tt', 'kk', 'bb', 'dd', 'gg', 'ɡɡ', 'ss', 'rr',
  // syllabic sonorants (PIE)
  'm̩', 'n̩', 'l̩', 'r̩',
]

const MULTICHAR_SORTED = [...MULTICHAR].sort((a, b) => b.length - a.length)

/** Split an IPA string into segments. */
export function tokenizeIpa(s: string): string[] {
  const out: string[] = []
  let i = 0
  outer: while (i < s.length) {
    for (const m of MULTICHAR_SORTED) {
      if (s.startsWith(m, i)) {
        out.push(m)
        i += m.length
        continue outer
      }
    }
    out.push(s[i]!)
    i += 1
  }
  return out
}

const VOWELS = new Set([
  'i', 'y', 'e', 'ø', 'ɛ', 'æ', 'a', 'ɑ', 'ɒ', 'ɔ', 'o', 'u', 'ʊ', 'ɪ', 'ʌ', 'ə', 'ɜ',
  'iː', 'yː', 'eː', 'øː', 'ɛː', 'æː', 'aː', 'ɑː', 'ɔː', 'oː', 'uː', 'ɜː',
  'aɪ', 'aʊ', 'eɪ', 'oʊ', 'ɔɪ', 'əi', 'əu', 'ai', 'au', 'eu', 'iu', 'ie',
  'æa', 'eo', 'ea', 'ei', 'oi', 'ou', 'ui', 'wɔ', 'je', 'wa',
  'æaː', 'eoː', 'ieː',
])

const NASALS = new Set(['m', 'n', 'ŋ', 'mm', 'nn', 'm̩', 'n̩'])
const LIQUIDS = new Set(['l', 'r', 'll', 'rr', 'l̩', 'r̩'])
const GLIDES = new Set(['j', 'w'])
const STOPS = new Set([
  'p', 'b', 't', 'd', 'k', 'g', 'ɡ', 'kʷ', 'gʷ', 'ɡʷ',
  'bʰ', 'dʰ', 'gʰ', 'ɡʰ', 'gʷʰ', 'ɡʷʰ',
  'pp', 'tt', 'kk', 'bb', 'dd', 'gg', 'ɡɡ',
])
const FRICATIVES = new Set([
  'f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'x', 'ɣ', 'h', 'xʷ', 'ɣʷ', 'hʷ', 'β', 'ss',
])
/** Velar-ish — the Grimm's Law and palatalisation environments care about these. */
const VELARS = new Set(['k', 'g', 'ɡ', 'x', 'ɣ', 'ŋ', 'kʷ', 'gʷ', 'ɡʷ'])
/** Front vowels — trigger Old English palatalisation and i-mutation. */
const FRONT = new Set([
  'i', 'ɪ', 'y', 'e', 'ɛ', 'æ', 'ø', 'iː', 'yː', 'eː', 'ɛː', 'æː', 'øː', 'ie', 'ei',
])
const BACK = new Set(['u', 'ʊ', 'o', 'ɔ', 'ɑ', 'ɒ', 'a', 'uː', 'oː', 'ɔː', 'ɑː', 'aː'])
/** Laryngeals (PIE). */
const LARYNGEAL = new Set(['h₁', 'h₂', 'h₃'])

export const CLASSES: Record<string, Set<string>> = {
  V: VOWELS,
  N: NASALS,
  L: LIQUIDS,
  G: GLIDES,
  S: STOPS,
  F: FRICATIVES,
  K: VELARS,
  I: FRONT,
  U: BACK,
  H: LARYNGEAL,
  /** Any sonorant — the class that goes syllabic in PIE. */
  R: new Set([...NASALS, ...LIQUIDS]),
  /** Obstruents. */
  O: new Set([...STOPS, ...FRICATIVES]),
}

CLASSES.C = new Set([...STOPS, ...FRICATIVES, ...NASALS, ...LIQUIDS, ...GLIDES])

export function isVowel(p: string): boolean {
  return VOWELS.has(p)
}

export function inClass(name: string, p: string): boolean {
  const set = CLASSES[name]
  return set ? set.has(p) : false
}

/** Strip the length mark from a long vowel. `aː` → `a`. */
export function shorten(p: string): string {
  return p.endsWith('ː') ? p.slice(0, -1) : p
}

/** Add a length mark unless the segment is already long or a diphthong. */
export function lengthen(p: string): string {
  if (p.endsWith('ː') || p.length > 1) return p
  return p + 'ː'
}

/**
 * Count syllables as the number of vowel segments. Adequate here because every
 * stage's phoneme string is fully segmented before this is called.
 */
export function syllableCount(word: { p: string }[]): number {
  return word.filter((s) => isVowel(s.p)).length
}

/**
 * Index of the segment that opens the final syllable's rhyme, i.e. the last
 * vowel. Returns -1 for a word with no vowels.
 */
export function lastVowelIndex(word: { p: string }[]): number {
  for (let i = word.length - 1; i >= 0; i -= 1) {
    if (isVowel(word[i]!.p)) return i
  }
  return -1
}

/**
 * True when the vowel at `i` sits in an open syllable — no more than one
 * consonant separates it from the next vowel. Middle English open-syllable
 * lengthening depends on this.
 */
export function inOpenSyllable(word: { p: string }[], i: number): boolean {
  let consonants = 0
  for (let j = i + 1; j < word.length; j += 1) {
    if (isVowel(word[j]!.p)) return consonants <= 1
    consonants += 1
  }
  return false
}
