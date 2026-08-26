import { describe, expect, it } from 'vitest'
import { classify, graphemesToPhonemes, ipa, reconstruct, stagesFor } from '../src/engine'
import type { Lineage } from '../src/engine'

const g2p = (w: string) => ipa(graphemesToPhonemes(w))
const at = (word: string, stage: string, lineage?: Lineage) => {
  const found = reconstruct(word, lineage).stages.find((s) => s.stage.id === stage)
  if (!found) throw new Error(`no stage ${stage}`)
  return found
}

describe('grapheme-to-phoneme', () => {
  it('reads consonant digraphs', () => {
    expect(g2p('ship')).toBe('ʃɪp')
    expect(g2p('thin')).toBe('θɪn')
    expect(g2p('chan')).toBe('tʃæn')
    expect(g2p('phlan')).toBe('flæn')
  })

  it('silences the letters English stopped pronouncing', () => {
    expect(g2p('knarn')).toBe('nɑrn')
    expect(g2p('wrast')).toBe('ræst')
    expect(g2p('flight')).toBe('flaɪt')
  })

  it('distinguishes tense from lax vowels by syllable shape', () => {
    expect(g2p('flan')).toBe('flæn')
    expect(g2p('flane')).toBe('fleɪn')
    expect(g2p('flin')).toBe('flɪn')
    expect(g2p('fline')).toBe('flaɪn')
  })

  it('keeps soft and hard c and g apart', () => {
    expect(g2p('cang')).toBe('kæŋ')
    expect(g2p('cing')).toBe('sɪŋ')
    expect(g2p('gan')).toBe('ɡæn')
    expect(g2p('gin')).toBe('dʒɪn')
  })

  it('records the spelling each phoneme came from', () => {
    const sea = graphemesToPhonemes('seat')
    expect(sea[1]).toMatchObject({ p: 'iː', src: 'ea' })
    const see = graphemesToPhonemes('seet')
    expect(see[1]).toMatchObject({ p: 'iː', src: 'ee' })
  })

  it('parks a silent final -e on the preceding segment', () => {
    const w = graphemesToPhonemes('flane')
    expect(w[w.length - 1]).toMatchObject({ p: 'n', src: 'ne' })
  })

  it('gives final -le its syllable', () => {
    // `grimble` is grim-bel, two syllables. Dropping the vowel leaves an
    // unpronounceable /bl/ and makes the word a syllable short.
    expect(g2p('grimble')).toBe('ɡrɪmbəl')
    expect(g2p('sprockle')).toBe('sprɒkəl')
    expect(g2p('little')).toBe('lɪtəl')
  })

  it('leaves -le alone after a vowel, where it is not syllabic', () => {
    expect(g2p('ale')).toBe('eɪl')
    expect(g2p('faile')).toBe('feɪl')
  })

  it('rejects input with no letters', () => {
    expect(() => graphemesToPhonemes('!!!')).toThrow(/letters a–z/)
  })
})

describe('lineage classification', () => {
  it.each([
    ['flarn', 'germanic'],
    ['knurst', 'germanic'],
    ['thwock', 'germanic'],
    ['blightle', 'germanic'],
    ['prolation', 'romance'],
    ['flabricity', 'romance'],
    ['vermolent', 'romance'],
    ['contradicture', 'romance'],
  ])('puts %s in the %s lineage', (word, lineage) => {
    expect(classify(word).lineage).toBe(lineage)
  })

  it('explains itself', () => {
    expect(classify('flaration').reason).toMatch(/Latinate/)
    expect(classify('knight').reason).toMatch(/Germanic/)
  })

  it('defaults to Germanic when the spelling is silent', () => {
    const c = classify('ebo')
    expect(c.lineage).toBe('germanic')
    expect(c.reason).toMatch(/default/)
  })
})

/**
 * The engine is aimed at words that never existed, which makes it hard to grade.
 * Feeding it real words whose histories *are* attested is the honest check: if
 * the sound laws are right, they should land on or near the recorded forms.
 */
describe('real words land near their attested history', () => {
  it('ship → Old English scip', () => {
    expect(at('ship', 'oe').form).toBe('scip')
  })

  it('knight → Old English cnīht', () => {
    expect(at('knight', 'oe').form).toBe('cnīht')
  })

  it('foot → Old English fōt', () => {
    expect(at('foot', 'oe').form).toBe('fōt')
  })

  it('stone → Old English stān-', () => {
    expect(at('stone', 'oe').form).toMatch(/^stān/)
  })

  it('mouse → Old English mūs-', () => {
    expect(at('mouse', 'oe').form).toMatch(/^mūs/)
  })

  it('nation → Latin nātiōnem', () => {
    expect(at('nation', 'la').form).toBe('nātiōnem')
  })

  it('ship → Proto-Germanic *skip-', () => {
    expect(at('ship', 'pg').form).toMatch(/^\*skip/)
  })

  it('stone → Proto-Germanic *stain-, restoring the diphthong', () => {
    expect(at('stone', 'pg').form).toMatch(/^\*stain/)
  })
})

describe("Grimm's Law", () => {
  it('turns Germanic /f/ back into PIE *p — father/pater', () => {
    expect(at('father', 'pie').form).toMatch(/^\*p/)
    expect(at('foot', 'pie').form).toMatch(/^\*p/)
  })

  it('turns Germanic /θ/ back into PIE *t — three/trēs', () => {
    expect(at('three', 'pie').form).toMatch(/^\*t/)
  })

  it('turns Germanic /h/ back into PIE *k — heart/cordis', () => {
    expect(at('heart', 'pie').form).toMatch(/^\*k/)
  })

  it('turns Germanic /b d g/ back into PIE aspirates — brother/frāter', () => {
    expect(at('brolth', 'pie').form).toMatch(/^\*bʰ/)
    expect(at('dworn', 'pie').form).toMatch(/^\*dʰ/)
  })

  it('turns Germanic /p t k/ back into PIE plain voiced stops', () => {
    expect(at('tolp', 'pie').ipa).toMatch(/^d/)
    expect(at('polt', 'pie').ipa).toMatch(/^b/)
  })

  it('exempts stops after /s/, so stark keeps its /t/', () => {
    // PIE *st- came through Germanic untouched; without the exception this
    // would wrongly surface as *sd-.
    expect(at('stark', 'pie').ipa).toMatch(/^st/)
    expect(at('spelt', 'pie').ipa).toMatch(/^sp/)
    expect(at('skelp', 'pie').ipa).toMatch(/^sk/)
  })
})

describe('invented words', () => {
  const words = ['flarn', 'sprockle', 'blorth', 'knurst', 'thwaggle', 'quibbet', 'yeltch', 'wraithen']

  it.each(words)('derives %s all the way to PIE', (w) => {
    const r = reconstruct(w)
    expect(r.stages).toHaveLength(stagesFor(r.lineage).length + 1)
    for (const s of r.stages) {
      expect(s.form.replace(/[*-]/g, '')).not.toBe('')
      expect(s.ipa).not.toBe('')
    }
    expect(r.stages[r.stages.length - 1]!.stage.name).toBe('Proto-Indo-European')
  })

  it.each(words)('is deterministic for %s', (w) => {
    expect(reconstruct(w)).toEqual(reconstruct(w))
  })

  it('echoes the typed spelling back verbatim', () => {
    // Reconstructing this line from the phonemes reordered it into `grimbel`,
    // and collapsed the doubled g of `thwaggle`.
    expect(reconstruct('grimble').stages[0]!.form).toBe('grimble')
    expect(reconstruct('thwaggle').stages[0]!.form).toBe('thwaggle')
    expect(reconstruct('  ShIP! ').stages[0]!.form).toBe('ship')
  })

  it('carries no schwa into any ancient stage, on either chain', () => {
    // Schwa is a Middle English levelling. Old English had full vowels in these
    // endings, Latin had no schwa at all, and PIE had none either. Both chains
    // have to resolve it — fixing only the Germanic side left `-able` and
    // `-ture` words carrying a schwa all the way into a PIE root.
    const ANCIENT = ['oe', 'pwg', 'pg', 'la', 'pit', 'pie']
    const words = ['grimble', 'sprockle', 'thwaggle', 'knurst', 'trible', 'groable', 'nuncture']

    for (const w of words) {
      for (const s of reconstruct(w).stages) {
        if (!ANCIENT.includes(s.stage.id)) continue
        expect(s.ipa, `${w} at ${s.stage.id}`).not.toContain('ə')
      }
    }
  })

  it('resolves a Latinate -le into a real Latin ending', () => {
    // Latin -ula: `tabula`, `rēgula`, `fābula`. The second-declension `-ulum`
    // is equally possible and is offered alongside rather than picked silently.
    const la = at('trible', 'la', 'romance')
    expect(la.form).toMatch(/ulam$/)
    expect(la.ambiguities.map((a) => a.alternative)).toContain('tribulum')
  })

  it('marks reconstructed stages with an asterisk and attested ones without', () => {
    const r = reconstruct('flarn')
    for (const s of r.stages) {
      expect(s.form.startsWith('*')).toBe(s.stage.reconstructed)
    }
  })

  /**
   * Each stage renders through a lookup table, and a phoneme missing from it
   * falls through as its raw IPA symbol — `vermɔːlentem` instead of
   * `vermōlentem`. That is silent: the form still looks vaguely plausible, so
   * nothing catches it except reading every output. This does the reading.
   */
  it('never leaks raw IPA into a stage spelling', () => {
    // Symbols that only ever appear when a table lookup missed.
    const RAW = /[ɔɛɪʊʌæɑɒəɜʃʒŋɣ]/u
    // Minus the ones a given tradition legitimately writes.
    const LEGITIMATE: Record<string, RegExp> = {
      oe: /[æǣœ]/u,
      pit: /[χβ]/u,
    }

    const words = [
      'vermolent', 'weazzen', 'sangy', 'shrend', 'trible', 'groable',
      'prolation', 'flabricity', 'contradicture', 'knurst', 'thwaggle',
      'sprockle', 'blorth', 'quibbet', 'yeltch', 'wraithen', 'stark',
    ]

    for (const w of words) {
      for (const lineage of ['germanic', 'romance'] as const) {
        for (const s of reconstruct(w, lineage).stages) {
          if (s.stage.id === 'mode') continue
          const allowed = LEGITIMATE[s.stage.id]
          const suspect = [...s.form].filter((ch) => !allowed?.test(ch)).join('')
          expect(suspect, `${w} (${lineage}) at ${s.stage.id}: ${s.form}`).not.toMatch(RAW)
        }
      }
    }
  })

  it('leaves no internal marker symbols in the output', () => {
    for (const w of [...words, 'stark', 'spelt', 'skelp']) {
      expect(reconstruct(w).stages.map((s) => s.form).join(' ')).not.toMatch(/[ˢ]/)
    }
  })

  it('shows the rhotacism alternative with the *z it describes', () => {
    // The note says the /r/ could go back to *z, so the form beside it has to
    // actually show a z — the West Germanic spelling convention writes it.
    const pwg = at('blorth', 'pwg')
    const rhotacism = pwg.ambiguities.find((a) => a.name === 'Rhotacism')
    expect(rhotacism).toBeDefined()
    expect(rhotacism!.alternative).toContain('z')
  })

  it('reports which sound changes fired', () => {
    const r = reconstruct('knight')
    const names = r.stages.flatMap((s) => s.applied.map((a) => a.name))
    expect(names).toContain('Great Vowel Shift')
    expect(names).toContain('Cluster reduction, reversed')
    expect(names).toContain('Grimm’s Law')
  })

  it.each(['blorth', 'flarn', 'sprockle', 'knurst'])(
    'surfaces %s ambiguities instead of picking silently',
    (w) => {
      const pie = at(w, 'pie')
      expect(pie.ambiguities.length).toBeGreaterThan(0)
      for (const a of pie.ambiguities) {
        expect(a.alternative.replace(/[*-]/g, '')).not.toBe('')
        expect(a.alternative).not.toBe(pie.form)
        expect(a.reason.length).toBeGreaterThan(20)
      }
    },
  )
})

describe('the Romance route', () => {
  it('runs through Old French and Latin', () => {
    const ids = reconstruct('flaration').stages.map((s) => s.stage.id)
    expect(ids).toEqual(['mode', 'emode', 'me', 'ofr', 'la', 'pit', 'pie'])
  })

  it('restores the Latin accusative, picking the ending the shape selects', () => {
    // Consonant-final → third declension -em, the largest declension.
    expect(at('vermolent', 'la').form).toMatch(/em$/)
    // French -e → first declension -am, which the shape does determine.
    expect(at('cure', 'la', 'romance').form).toMatch(/am$/)
  })

  it('grades close to attested Latin on real borrowings', () => {
    // The Germanic chain is checked against attested Old English above. This is
    // the same honest check for the Romance side, which is the weaker of the two.
    const cases: [string, string][] = [
      ['nation', 'nātiōnem'],
      ['part', 'partem'],
      ['art', 'artem'],
      ['cure', 'curam'],
      ['table', 'tabulam'],
    ]
    for (const [word, attested] of cases) {
      expect(at(word, 'la', 'romance').form, word).toBe(attested)
    }
  })

  it('offers the second declension when the shape cannot decide', () => {
    // `port` really is from `portum`, and nothing in the French tells you.
    const alts = at('port', 'la', 'romance').ambiguities.map((a) => a.alternative)
    expect(alts).toContain('portum')
  })

  it('undoes rhotacism — Latin flōr- from *flōs-', () => {
    expect(at('flarine', 'pit', 'romance').ipa).toMatch(/s/)
  })

  it('can be forced onto a word the classifier read the other way', () => {
    const forced = reconstruct('flarn', 'romance')
    expect(forced.lineage).toBe('romance')
    expect(forced.lineageReason).toMatch(/Forced/)
    expect(forced.stages.map((s) => s.stage.id)).toContain('la')
  })
})

describe('input handling', () => {
  it('ignores case, spaces and punctuation', () => {
    expect(reconstruct('  FlArN! ').input).toBe('flarn')
  })

  it('refuses empty input', () => {
    expect(() => reconstruct('   ')).toThrow(/letters a–z/)
    expect(() => reconstruct('123')).toThrow(/letters a–z/)
  })

  it('refuses absurdly long input', () => {
    expect(() => reconstruct('a'.repeat(40))).toThrow(/24 letters/)
  })

  it('survives a single letter', () => {
    expect(() => reconstruct('a')).not.toThrow()
  })
})
