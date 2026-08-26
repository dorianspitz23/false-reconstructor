/**
 * Core types for the reconstruction engine.
 *
 * The whole pipeline is a fold over a list of `Stage`s. Each stage owns a set of
 * sound changes stated in the *historically forward* direction in the comments,
 * but written here in the *reverse* direction, because we are walking backwards
 * through time from the modern form.
 */

/**
 * A single sound segment.
 *
 * `src` carries the modern graphemes the segment came from. English spelling is
 * conservative — it often preserves distinctions the modern pronunciation has
 * lost — so the source spelling is genuine evidence for what the earlier form
 * was. `<ea>` and `<ee>` both say /iː/ today but descend from Middle English
 * /ɛː/ and /eː/ respectively, and only the spelling still knows which.
 */
export interface Segment {
  /** IPA value of the segment at the current stage. */
  p: string
  /** Modern English graphemes this segment descends from (lowercased). */
  src: string
  /** Marks a segment as reconstructed rather than derived from evidence. */
  added?: boolean
}

export type Word = Segment[]

/** Left-to-right matcher used in rule patterns and environments. */
export type Matcher =
  | { kind: 'lit'; value: string }
  | { kind: 'class'; name: string }
  | { kind: 'set'; values: string[] }
  | { kind: 'boundary' }
  | { kind: 'any' }

/** An output token: either a literal phoneme or an echo of a matched input. */
export type Output =
  | { kind: 'lit'; value: string }
  /** `%1` echoes the 1st matched segment; `suffix` appends to it (e.g. `%1ː`). */
  | { kind: 'echo'; index: number; suffix: string }

export interface CompiledRule {
  from: Matcher[]
  to: Output[]
  pre: Matcher[]
  post: Matcher[]
}

/** A sound change, as authored. */
export interface SoundChange {
  /** Stable id, used in tests and in the UI's derivation trace. */
  id: string
  /** The change's conventional name, e.g. "Grimm's Law". */
  name: string
  /**
   * Rule in `A > B / X _ Y` notation, written in the *reverse* (backwards in
   * time) direction. `∅` on either side means insertion/deletion. `#` is a word
   * boundary. Bare capitals are phoneme classes; `[a b c]` is an inline set.
   *
   * Omitted when `apply` is given.
   */
  rule?: string
  /**
   * Escape hatch for the few changes that need real structure — syllable
   * counting, stress — rather than a local environment. Used instead of `rule`.
   */
  apply?: (word: Word) => Word
  /**
   * Only fire when the matched segment descends from these modern graphemes.
   * Resolves ambiguities that the modern spelling still records.
   */
  srcHint?: string[]
  /** Human-readable note shown in the derivation trace. */
  note?: string
}

/** Something we *could* say but can't decide between — surfaced, never guessed. */
export interface Ambiguity {
  /** Short label, e.g. "Verner's Law". */
  name: string
  /** The alternative form, already rendered in the stage's orthography. */
  alternative: string
  /** Why both are defensible. */
  reason: string
}

export interface Stage {
  id: string
  /** Display name, e.g. "Old English". */
  name: string
  /** Approximate date range of the *output* form, e.g. "c. 900". */
  period: string
  /** One-line orientation for a non-linguist. */
  blurb: string
  /** True when forms at this stage are unattested reconstructions (get a `*`). */
  reconstructed: boolean
  /** How much to trust the output, 0–1. Falls off as we go deeper. */
  confidence: number
  /** Sound changes taking the *previous* (later) stage back to this one. */
  changes: SoundChange[]
  /** Renders this stage's phoneme string in its own conventional orthography. */
  spell: (word: Word) => string
  /** Stage-specific reconstructions the evidence cannot decide between. */
  ambiguities?: (word: Word) => Ambiguity[]
}

/** One stage's worth of output. */
export interface StageResult {
  stage: Pick<Stage, 'id' | 'name' | 'period' | 'blurb' | 'reconstructed' | 'confidence'>
  /** The form written in the stage's own orthography, prefixed `*` if unattested. */
  form: string
  /** Broad IPA transcription. */
  ipa: string
  /** Which sound changes actually fired, in order. */
  applied: AppliedChange[]
  ambiguities: Ambiguity[]
}

export interface AppliedChange {
  id: string
  name: string
  note?: string
  /** IPA before and after this single change, for the trace. */
  before: string
  after: string
}

export type Lineage = 'germanic' | 'romance'

export interface Reconstruction {
  input: string
  lineage: Lineage
  /** Why this lineage was chosen, and what tipped it. */
  lineageReason: string
  /** Modern-form IPA, the starting point of the derivation. */
  modernIpa: string
  /** Ordered oldest-last: Modern English first, PIE last. */
  stages: StageResult[]
}
