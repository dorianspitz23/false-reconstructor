/**
 * English spelling → Modern English phonemes.
 *
 * A dictionary is no use here: the whole point is words that do not exist. So
 * this is a rule-based grapheme-to-phoneme pass over the letter string, longest
 * grapheme first, with the handful of context conditions English orthography
 * actually obeys (magic-e, open syllables, soft c/g, final -ng).
 *
 * Every phoneme keeps the letters it came from in `Segment.src`. That matters
 * more than it looks: English spelling is a century or two behind English
 * speech, so the letters routinely preserve distinctions the sounds have merged.
 * `<ea>` and `<ee>` are both /iː/ now but came from different Middle English
 * vowels, and only the spelling still knows which is which.
 */

import type { Segment, Word } from './types'

interface Ctx {
  /** The whole lowercased letter string. */
  w: string
  /** Index of the grapheme being matched. */
  i: number
}

interface G2PRule {
  g: string
  ipa: string[]
  /**
   * Source spelling per phoneme, for the rare grapheme that splits across
   * segments carrying different evidence. Defaults to `g` for all of them.
   */
  srcs?: string[]
  when?: (c: Ctx) => boolean
}

const VOWEL_LETTERS = 'aeiouy'
const isVowelLetter = (ch: string | undefined) => !!ch && VOWEL_LETTERS.includes(ch)
const isFrontLetter = (ch: string | undefined) => !!ch && 'eiy'.includes(ch)

const atStart = (c: Ctx) => c.i === 0
const after = (c: Ctx, n: number) => c.w[c.i - n]
const nextAfter = (c: Ctx, len: number) => c.w[c.i + len]

/** True at the very end of the word, `len` graphemes from here. */
const atEnd = (c: Ctx, len: number) => c.i + len >= c.w.length

/**
 * Magic-e and open-syllable tensing: a lone vowel letter is "long" when exactly
 * one consonant separates it from a following vowel letter (`flane`, `flabo`),
 * and short otherwise (`flan`, `flanto`).
 */
function isTense(c: Ctx): boolean {
  const rest = c.w.slice(c.i + 1)
  // `<vowel>Ce` at word end, or `<vowel>C<vowel>` anywhere.
  if (/^[^aeiouy]e$/.test(rest)) return true
  if (/^[^aeiouy][aeiouy]/.test(rest)) return true
  // A lone vowel letter at word end is tense (`flabo`, `hi`).
  if (rest === '' && c.i > 0) return true
  return false
}

/** Rules are tried in this order at each position; longest graphemes first. */
const RULES: G2PRule[] = [
  // ---- word-initial clusters that lost a consonant, but kept the letter ----
  { g: 'kn', ipa: ['n'], when: atStart },
  { g: 'gn', ipa: ['n'], when: atStart },
  { g: 'pn', ipa: ['n'], when: atStart },
  { g: 'ps', ipa: ['s'], when: atStart },
  { g: 'wr', ipa: ['r'], when: atStart },
  { g: 'rh', ipa: ['r'], when: atStart },
  { g: 'x', ipa: ['z'], when: atStart },

  // ---- Latinate endings, matched whole so the Romance chain can unpack them ----
  { g: 'cious', ipa: ['ʃ', 'ə', 's'], when: (c) => atEnd(c, 5) },
  { g: 'tious', ipa: ['ʃ', 'ə', 's'], when: (c) => atEnd(c, 5) },
  { g: 'tion', ipa: ['ʃ', 'ə', 'n'], when: (c) => atEnd(c, 4) },
  { g: 'sion', ipa: ['ʒ', 'ə', 'n'], when: (c) => atEnd(c, 4) },
  { g: 'ture', ipa: ['tʃ', 'ə', 'r'], when: (c) => atEnd(c, 4) },

  // ---- polygraphs ----
  { g: 'ough', ipa: ['aʊ'] },
  { g: 'augh', ipa: ['ɔː'] },
  { g: 'eigh', ipa: ['eɪ'] },
  { g: 'igh', ipa: ['aɪ'] },
  { g: 'tch', ipa: ['tʃ'] },
  { g: 'dge', ipa: ['dʒ'] },
  { g: 'sch', ipa: ['s', 'k'] },
  { g: 'ear', ipa: ['ɜ', 'r'] },
  { g: 'air', ipa: ['ɛ', 'r'] },
  { g: 'oar', ipa: ['ɔ', 'r'] },
  { g: 'our', ipa: ['aʊ', 'r'] },

  // ---- consonant digraphs ----
  { g: 'ch', ipa: ['tʃ'] },
  { g: 'sh', ipa: ['ʃ'] },
  { g: 'th', ipa: ['θ'] },
  { g: 'ph', ipa: ['f'] },
  { g: 'wh', ipa: ['w'] },
  { g: 'ck', ipa: ['k'] },
  { g: 'qu', ipa: ['k', 'w'] },
  { g: 'gh', ipa: ['ɡ'], when: atStart },
  { g: 'gh', ipa: [] },
  // `-ng` is /ŋ/ finally and before a consonant, /ŋɡ/ between vowels.
  { g: 'ng', ipa: ['ŋ'], when: (c) => atEnd(c, 2) || !isVowelLetter(nextAfter(c, 2)) },
  { g: 'ng', ipa: ['ŋ', 'ɡ'] },
  { g: 'nk', ipa: ['ŋ', 'k'] },
  { g: 'sc', ipa: ['s'], when: (c) => isFrontLetter(nextAfter(c, 2)) },
  { g: 'sc', ipa: ['s', 'k'] },
  { g: 'mb', ipa: ['m'], when: (c) => atEnd(c, 2) },
  { g: 'mn', ipa: ['m'], when: (c) => atEnd(c, 2) },

  // ---- vowel digraphs ----
  { g: 'ee', ipa: ['iː'] },
  { g: 'ea', ipa: ['iː'] },
  { g: 'ai', ipa: ['eɪ'] },
  { g: 'ay', ipa: ['eɪ'] },
  { g: 'ei', ipa: ['eɪ'] },
  { g: 'ey', ipa: ['eɪ'] },
  { g: 'oa', ipa: ['oʊ'] },
  { g: 'oe', ipa: ['oʊ'] },
  { g: 'oo', ipa: ['uː'] },
  { g: 'ou', ipa: ['aʊ'] },
  { g: 'ow', ipa: ['aʊ'] },
  { g: 'oi', ipa: ['ɔɪ'] },
  { g: 'oy', ipa: ['ɔɪ'] },
  { g: 'au', ipa: ['ɔː'] },
  { g: 'aw', ipa: ['ɔː'] },
  { g: 'eu', ipa: ['j', 'uː'] },
  { g: 'ew', ipa: ['j', 'uː'] },
  { g: 'ie', ipa: ['iː'] },
  { g: 'ui', ipa: ['uː'] },
  { g: 'ue', ipa: ['uː'] },

  // ---- r-coloured vowels, kept as plain vowel + /r/ ----
  // Modern r-colouring is very late; every earlier stage here was rhotic with a
  // full vowel before the /r/, so this is the historically useful shape.
  { g: 'ar', ipa: ['ɑ', 'r'] },
  { g: 'or', ipa: ['ɔ', 'r'] },
  { g: 'er', ipa: ['ɜ', 'r'] },
  { g: 'ir', ipa: ['ɜ', 'r'] },
  { g: 'ur', ipa: ['ɜ', 'r'] },
  { g: 'yr', ipa: ['ɜ', 'r'] },

  // ---- single vowels ----
  { g: 'a', ipa: ['eɪ'], when: isTense },
  { g: 'a', ipa: ['æ'] },
  { g: 'e', ipa: [], when: (c) => atEnd(c, 1) && c.i > 1 && !isVowelLetter(after(c, 1)) },
  { g: 'e', ipa: ['iː'], when: isTense },
  { g: 'e', ipa: ['ɛ'] },
  { g: 'i', ipa: ['aɪ'], when: isTense },
  { g: 'i', ipa: ['ɪ'] },
  { g: 'o', ipa: ['oʊ'], when: isTense },
  { g: 'o', ipa: ['ɒ'] },
  { g: 'u', ipa: ['j', 'uː'], when: isTense },
  { g: 'u', ipa: ['ʌ'] },
  { g: 'y', ipa: ['j'], when: (c) => atStart(c) && isVowelLetter(nextAfter(c, 1)) },
  { g: 'y', ipa: ['aɪ'], when: isTense },
  { g: 'y', ipa: ['i'], when: (c) => atEnd(c, 1) },
  { g: 'y', ipa: ['ɪ'] },

  /*
   * Final `-le` after a consonant is a syllabic /l/ — `table`, `apple`,
   * `little`. The vowel is real and has to be here, or the word comes out a
   * syllable short and the transcription reads as an unpronounceable cluster.
   *
   * The /l/ keeps `l` as its source rather than `le`, because that trailing e
   * is spent: Middle English wrote these `appel`, with the schwa already in the
   * ending and no further final -e to restore.
   */
  {
    g: 'le',
    ipa: ['ə', 'l'],
    srcs: ['e', 'l'],
    when: (c) => atEnd(c, 2) && c.i > 0 && !isVowelLetter(after(c, 1)),
  },

  // ---- single consonants ----
  { g: 'c', ipa: ['s'], when: (c) => isFrontLetter(nextAfter(c, 1)) },
  { g: 'c', ipa: ['k'] },
  { g: 'g', ipa: ['dʒ'], when: (c) => isFrontLetter(nextAfter(c, 1)) },
  { g: 'g', ipa: ['ɡ'] },
  { g: 's', ipa: ['z'], when: (c) => c.i > 0 && isVowelLetter(after(c, 1)) && atEnd(c, 1) },
  { g: 's', ipa: ['s'] },
  { g: 'j', ipa: ['dʒ'] },
  { g: 'x', ipa: ['k', 's'] },
  { g: 'b', ipa: ['b'] },
  { g: 'd', ipa: ['d'] },
  { g: 'f', ipa: ['f'] },
  { g: 'h', ipa: ['h'] },
  { g: 'k', ipa: ['k'] },
  { g: 'l', ipa: ['l'] },
  { g: 'm', ipa: ['m'] },
  { g: 'n', ipa: ['n'] },
  { g: 'p', ipa: ['p'] },
  { g: 'r', ipa: ['r'] },
  { g: 't', ipa: ['t'] },
  { g: 'v', ipa: ['v'] },
  { g: 'w', ipa: ['w'] },
  { g: 'z', ipa: ['z'] },
]

/**
 * How many grapheme rules there are. Quoted in the README, and derived here for
 * the same reason the sound-change count is — a number written down in prose
 * goes stale the first time anyone adds a rule.
 */
export const G2P_RULE_COUNT = RULES.length

/** Trim a word down to the letters the engine can read. */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z]/g, '')
}

/**
 * Convert a spelling to Modern English phonemes.
 * Throws on input that contains no usable letters.
 */
export function graphemesToPhonemes(input: string): Word {
  const w = collapseDoubles(normalize(input))
  if (!w) throw new Error('Enter a word using the letters a–z.')

  const out: Word = []
  let i = 0

  while (i < w.length) {
    const ctx: Ctx = { w, i }
    const rule = RULES.find((r) => w.startsWith(r.g, i) && (!r.when || r.when({ ...ctx })))

    if (!rule) {
      // Every letter a–z has a fallback rule, so this is unreachable in practice.
      i += 1
      continue
    }

    rule.ipa.forEach((p, n) => out.push({ p, src: rule.srcs?.[n] ?? rule.g }))

    // A silent grapheme still has to leave a trace, or later stages lose the
    // evidence. Attach it to the segment before it: `flane` ends up with the
    // final /n/ carrying src `ne`, which is what restores Middle English `-e`.
    if (rule.ipa.length === 0 && out.length > 0) {
      const prev = out[out.length - 1]!
      out[out.length - 1] = { ...prev, src: prev.src + rule.g }
    }

    i += rule.g.length
  }

  return out.length > 0 ? out : [{ p: 'ə', src: w }]
}

/**
 * Reduce doubled consonants to one letter. They mark vowel length in spelling
 * rather than a long consonant in speech (`flabber` has one /b/), and the length
 * information is already handled by `isTense`.
 */
function collapseDoubles(w: string): string {
  return w.replace(/([bcdfgklmnprstvz])\1/g, '$1')
}

/** True when the source spelling ends in a silent `e`. */
export function hasSilentFinalE(word: Word): boolean {
  const last = word[word.length - 1]
  return !!last && last.src.length > 1 && last.src.endsWith('e')
}

/** Debug helper: show each segment with the letters it came from. */
export function explain(word: Word): string {
  return word.map((s: Segment) => `${s.p}⟨${s.src}⟩`).join(' ')
}
