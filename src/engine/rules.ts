/**
 * A small sound-change applier.
 *
 * Rules are written in the notation historical linguists actually use:
 *
 *     A > B / X _ Y      "A becomes B between X and Y"
 *     k > x / _ t        "k becomes x before t"
 *     ə > ∅ / _ #        "schwa is lost word-finally"
 *     ∅ > z / _ #        "z is inserted word-finally"
 *     V N > %1ː / _ F    "vowel + nasal becomes a long vowel before a fricative"
 *
 * Capitals are phoneme classes (see `phonology.ts`), `[a b]` is an inline set,
 * `#` is a word boundary, `_` is the slot the rule applies to, and `%n` in the
 * output echoes the n-th matched input segment (with any trailing characters
 * appended, so `%1ː` lengthens whatever matched).
 *
 * Each rule makes a single left-to-right pass and does not re-scan its own
 * output, which is how ordered sound laws behave.
 */

import { CLASSES, tokenizeIpa } from './phonology'
import type { CompiledRule, Matcher, Output, Segment, SoundChange, Word } from './types'

const EMPTY = new Set(['∅', '0', 'Ø'])

function parseMatchers(text: string): Matcher[] {
  const trimmed = text.trim()
  if (!trimmed || EMPTY.has(trimmed)) return []

  const out: Matcher[] = []
  // Inline sets `[a b c]` are extracted first so their inner spaces survive.
  const tokens = trimmed.match(/\[[^\]]*\]|\S+/g) ?? []
  for (const tok of tokens) {
    if (tok === '#') {
      out.push({ kind: 'boundary' })
    } else if (tok === '*') {
      out.push({ kind: 'any' })
    } else if (tok.startsWith('[')) {
      out.push({ kind: 'set', values: tok.slice(1, -1).trim().split(/\s+/).filter(Boolean) })
    } else if (tok.length === 1 && CLASSES[tok]) {
      out.push({ kind: 'class', name: tok })
    } else {
      out.push({ kind: 'lit', value: tok })
    }
  }
  return out
}

function parseOutputs(text: string): Output[] {
  const trimmed = text.trim()
  if (!trimmed || EMPTY.has(trimmed)) return []
  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((tok): Output => {
      const echo = /^%(\d+)(.*)$/.exec(tok)
      if (echo) return { kind: 'echo', index: Number(echo[1]) - 1, suffix: echo[2] ?? '' }
      return { kind: 'lit', value: tok }
    })
}

export function compile(rule: string): CompiledRule {
  const [body, env = ''] = rule.split('/')
  const arrow = body!.split('>')
  if (arrow.length !== 2) {
    throw new Error(`Rule needs exactly one ">": ${rule}`)
  }

  let pre: Matcher[] = []
  let post: Matcher[] = []
  if (env.trim()) {
    const slot = env.split('_')
    if (slot.length !== 2) {
      throw new Error(`Environment needs exactly one "_": ${rule}`)
    }
    pre = parseMatchers(slot[0]!)
    post = parseMatchers(slot[1]!)
  }

  const from = parseMatchers(arrow[0]!)
  if (from.length === 0 && pre.length === 0 && post.length === 0) {
    throw new Error(`Unanchored insertion would fire everywhere: ${rule}`)
  }

  return { from, to: parseOutputs(arrow[1]!), pre, post }
}

/** Which edge a `#` refers to depends on which side of the `_` it sits on. */
type Side = 'pre' | 'post' | 'target'

/** Match `matchers` against `word` starting at `i`. Returns the end index or -1. */
function matchAt(word: Word, i: number, matchers: Matcher[], side: Side = 'target'): number {
  let pos = i
  for (const m of matchers) {
    if (m.kind === 'boundary') {
      // A boundary consumes nothing; it asserts we are at an edge. `#` before
      // the `_` means the start of the word, after it means the end — otherwise
      // `∅ > s / _ #` would also insert at position 0.
      const ok = side === 'pre' ? pos === 0 : side === 'post' ? pos === word.length : pos === 0 || pos === word.length
      if (!ok) return -1
      continue
    }
    const seg = word[pos]
    if (!seg) return -1
    switch (m.kind) {
      case 'lit':
        if (seg.p !== m.value) return -1
        break
      case 'class':
        if (!CLASSES[m.name]?.has(seg.p)) return -1
        break
      case 'set':
        if (!m.values.includes(seg.p)) return -1
        break
      case 'any':
        break
    }
    pos += 1
  }
  return pos
}

/**
 * Match `matchers` so that they *end* at index `i`. Used for left environments,
 * which are anchored on their right edge.
 */
function matchEndingAt(word: Word, i: number, matchers: Matcher[]): boolean {
  if (matchers.length === 0) return true
  // Count how many segments the pattern consumes (boundaries consume none).
  const width = matchers.filter((m) => m.kind !== 'boundary').length
  const start = i - width
  if (start < 0) return false
  return matchAt(word, start, matchers, 'pre') === i
}

function buildOutput(matched: Segment[], outputs: Output[]): Segment[] {
  // Deletions and insertions still need a `src` to carry spelling evidence
  // forward, so inherit it from whatever was matched.
  const inheritedSrc = matched.map((s) => s.src).join('')
  return outputs.map((o) => {
    if (o.kind === 'echo') {
      const base = matched[o.index]
      if (!base) throw new Error(`Rule echoes %${o.index + 1} but nothing matched there`)
      return { ...base, p: base.p + o.suffix }
    }
    return matched.length === 1 && matched[0]
      ? { ...matched[0], p: o.value }
      : { p: o.value, src: inheritedSrc, added: matched.length === 0 }
  })
}

/** Apply one compiled rule across a word. Returns a new word. */
export function applyRule(word: Word, compiled: CompiledRule, srcHint?: string[]): Word {
  const out: Word = []
  let i = 0

  while (i <= word.length) {
    // A zero-width `from` is an insertion, which the environment has to anchor.
    const end = matchAt(word, i, compiled.from)
    const fired =
      end !== -1 &&
      matchEndingAt(word, i, compiled.pre) &&
      matchAt(word, end, compiled.post, 'post') !== -1

    if (fired) {
      const matched = word.slice(i, end)
      // An insertion matches nothing, so it consults its left neighbour's
      // spelling instead — that is where the conditioning evidence sits.
      const witnesses = matched.length > 0 ? matched : [word[i - 1], word[i]].filter(Boolean)
      const hintOk =
        !srcHint || witnesses.some((s) => srcHint.some((h) => matchesHint(s!.src, h)))
      if (hintOk) {
        out.push(...buildOutput(matched, compiled.to))
        if (end > i) {
          // Consumed input: resume after it, so a rule never re-reads its output.
          i = end
        } else {
          // Insertion consumed nothing — emit the segment we are sitting on and
          // step forward, or the scan would never terminate.
          if (i < word.length) out.push(word[i]!)
          i += 1
        }
        continue
      }
    }

    if (i < word.length) out.push(word[i]!)
    i += 1
  }

  return out
}

/**
 * Match a segment's source spelling against a hint.
 * `"ea"` is exact, `"*e"` matches any spelling ending in `e`, `"e*"` any
 * spelling starting with `e`.
 */
function matchesHint(src: string, hint: string): boolean {
  if (hint.startsWith('*')) return src.endsWith(hint.slice(1))
  if (hint.endsWith('*')) return src.startsWith(hint.slice(0, -1))
  return src === hint
}

const cache = new Map<string, CompiledRule>()

function compileCached(rule: string): CompiledRule {
  let c = cache.get(rule)
  if (!c) {
    c = compile(rule)
    cache.set(rule, c)
  }
  return c
}

export interface RuleTrace {
  change: SoundChange
  before: Word
  after: Word
}

/** Run a stage's changes in order, recording which ones actually did something. */
export function applyChanges(word: Word, changes: SoundChange[]): { word: Word; trace: RuleTrace[] } {
  let current = word
  const trace: RuleTrace[] = []

  for (const change of changes) {
    const next = change.apply
      ? change.apply(current)
      : applyRule(current, compileCached(change.rule!), change.srcHint)
    if (ipa(next) !== ipa(current)) {
      trace.push({ change, before: current, after: next })
    }
    current = next
  }

  return { word: current, trace }
}

/** Render a word as a bare IPA string. */
export function ipa(word: Word): string {
  return word.map((s) => s.p).join('')
}

/** Build a word from an IPA string, tagging every segment with the same source. */
export function fromIpa(input: string | string[], src = ''): Word {
  const segments = typeof input === 'string' ? tokenizeIpa(input) : input
  return segments.map((p) => ({ p, src }))
}
