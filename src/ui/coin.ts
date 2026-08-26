/**
 * Coins a word English could have had but doesn't.
 *
 * Built from real English onsets, nuclei and codas so the result is
 * phonotactically legal — it should feel like a word you half-remember rather
 * than a keyboard mash.
 */

const ONSETS = [
  'b', 'bl', 'br', 'd', 'dr', 'dw', 'f', 'fl', 'fr', 'g', 'gl', 'gr', 'h', 'k', 'kn',
  'l', 'm', 'n', 'p', 'pl', 'pr', 'r', 's', 'sc', 'sh', 'shr', 'sk', 'sl', 'sm', 'sn',
  'sp', 'spl', 'spr', 'st', 'str', 'sw', 't', 'th', 'thr', 'tr', 'tw', 'v', 'w', 'wh',
  'wr', 'y', 'qu',
]

const NUCLEI = ['a', 'e', 'i', 'o', 'u', 'ea', 'ee', 'oo', 'ou', 'ai', 'oa', 'igh', 'aw', 'ei']

const CODAS = [
  'b', 'ck', 'd', 'dge', 'ft', 'g', 'ght', 'lb', 'ld', 'lf', 'lk', 'lm', 'lp', 'lt', 'm',
  'mp', 'n', 'nd', 'ng', 'nk', 'nt', 'p', 'r', 'rd', 'rk', 'rl', 'rm', 'rn', 'rp', 'rt',
  'rth', 's', 'sh', 'sk', 'sp', 'st', 't', 'tch', 'th', 'x', 'zz',
]

const SUFFIXES = ['', '', '', '', 'le', 'er', 'en', 'ow', 'y']

/** Latinate-looking endings, for coining a word on the other side of the family. */
const LATINATE = ['ation', 'ity', 'ment', 'ous', 'ate', 'ence', 'ive', 'ure']
const LATIN_STEMS = [
  'prol', 'verm', 'flabr', 'contrad', 'sempl', 'clarv', 'nunct', 'travers', 'obdur',
  'pellucr', 'gravest', 'liment',
]

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!

export function coinWord(): string {
  // One in five comes out Latinate, so the Romance chain gets an airing too.
  if (Math.random() < 0.2) return pick(LATIN_STEMS) + pick(LATINATE)

  const word = pick(ONSETS) + pick(NUCLEI) + pick(CODAS) + pick(SUFFIXES)
  // Reject anything unpronounceable that slipped through, and anything too long.
  return word.length > 11 ? coinWord() : word
}
