/**
 * False Reconstructor — public entry point.
 *
 * Give it a word English never had and it walks the real sound laws backwards,
 * stage by stage, to a Proto-Indo-European root. Nothing here is generated or
 * guessed: the same input always produces the same output, and every step is a
 * change you can look up in a handbook.
 */

import { classify } from './classify'
import { graphemesToPhonemes, normalize } from './g2p'
import { applyChanges, ipa } from './rules'
import { GERMANIC_TAIL } from './stages/germanic'
import { ROMANCE_TAIL } from './stages/romance'
import { EARLY_MODERN_TO_MIDDLE, MODERN_TO_EARLY_MODERN } from './stages/english'
import type { Lineage, Reconstruction, Stage, StageResult, Word } from './types'

export * from './types'
export { classify } from './classify'
export { graphemesToPhonemes, normalize, explain } from './g2p'
export { compile, applyRule, ipa } from './rules'

const SHARED: Stage[] = [MODERN_TO_EARLY_MODERN, EARLY_MODERN_TO_MIDDLE]

export function stagesFor(lineage: Lineage): Stage[] {
  return [...SHARED, ...(lineage === 'romance' ? ROMANCE_TAIL : GERMANIC_TAIL)]
}

/**
 * How many distinct sound changes are implemented, across both lineages.
 *
 * Derived rather than written down. The front page quotes this number, and a
 * hand-maintained one had already gone stale twice by the time anyone noticed.
 */
export const SOUND_CHANGE_COUNT = new Set(
  (['germanic', 'romance'] as const).flatMap((lineage) =>
    stagesFor(lineage).flatMap((stage) => stage.changes.map((c) => `${stage.id}:${c.id}`)),
  ),
).size

/** Every stage's public metadata, for building a legend without running anything. */
export function stageIndex(lineage: Lineage) {
  return stagesFor(lineage).map((s) => ({
    id: s.id,
    name: s.name,
    period: s.period,
    changes: s.changes.length,
  }))
}

function toResult(stage: Stage, word: Word, trace: ReturnType<typeof applyChanges>['trace']): StageResult {
  const form = stage.spell(word)
  return {
    stage: {
      id: stage.id,
      name: stage.name,
      period: stage.period,
      blurb: stage.blurb,
      reconstructed: stage.reconstructed,
      confidence: stage.confidence,
    },
    form: stage.reconstructed ? `*${form}` : form,
    ipa: ipa(word),
    applied: trace.map((t) => ({
      id: t.change.id,
      name: t.change.name,
      note: t.change.note,
      before: ipa(t.before),
      after: ipa(t.after),
    })),
    ambiguities: stage.ambiguities?.(word) ?? [],
  }
}

/**
 * Run the full derivation.
 *
 * @param input      the invented word, as spelled
 * @param override   force a lineage instead of letting the spelling decide
 */
export function reconstruct(input: string, override?: Lineage): Reconstruction {
  const cleaned = normalize(input)
  if (!cleaned) throw new Error('Enter a word using the letters a–z.')
  if (cleaned.length > 24) throw new Error('That is longer than any root needs to be — try 24 letters or fewer.')

  const guess = classify(cleaned)
  const lineage = override ?? guess.lineage
  const modern = graphemesToPhonemes(cleaned)

  const stages: StageResult[] = [
    {
      stage: {
        id: 'mode',
        name: 'Modern English',
        period: 'today',
        blurb: 'The word as you typed it — the only form in this list that never existed.',
        reconstructed: false,
        confidence: 1,
      },
      // Echo exactly what was typed. Rebuilding the spelling from the phonemes
      // reorders anything a grapheme split across segments — `grimble` came
      // back as `grimbel` — and this form is the one thing we already know.
      form: cleaned,
      ipa: ipa(modern),
      applied: [],
      ambiguities: [],
    },
  ]

  let current = modern
  for (const stage of stagesFor(lineage)) {
    const { word, trace } = applyChanges(current, stage.changes)
    stages.push(toResult(stage, word, trace))
    current = word
  }

  return {
    input: cleaned,
    lineage,
    lineageReason: override
      ? `Forced to the ${override === 'romance' ? 'Latinate' : 'Germanic'} lineage.`
      : guess.reason,
    modernIpa: ipa(modern),
    stages,
  }
}
