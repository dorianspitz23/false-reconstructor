/**
 * The Romance lineage: Middle English back to Proto-Indo-European.
 *
 *   Middle English → Old French → Latin → Proto-Italic → PIE
 *
 * This is the chain for the half of the English dictionary that arrived after
 * 1066 — the Latinate vocabulary that came in through Norman French and then
 * sat through the Great Vowel Shift alongside the native words.
 *
 * Both lineages converge on the same PIE, which is the point: Germanic *-az and
 * Latin *-os are the same ending, seen from two directions.
 */

import { spellLatin, spellOldFrench, spellPie, spellProtoItalic } from '../orthography'
import { isVowel, lengthen, shorten } from '../phonology'
import type { Ambiguity, Stage } from '../types'

/** Middle English → Old French, c. 1200. */
export const MIDDLE_TO_OLD_FRENCH: Stage = {
  id: 'ofr',
  name: 'Old French',
  period: 'c. 1200',
  blurb: 'The language of the Norman court, and the door half the English dictionary walked in through.',
  reconstructed: false,
  confidence: 0.75,
  spell: spellOldFrench,
  changes: [
    {
      id: 'ofr-tion',
      name: 'The -tion ending, unpacked',
      rule: 'ʃ ə n > s i o n',
      srcHint: ['tion', 'sion'],
      note: 'Modern /ʃən/ is a compression of Old French -cion, itself from Latin -tiōnem.',
    },
    {
      id: 'ofr-ts',
      name: 'Old French /ts/',
      rule: 's > t s',
      srcHint: ['c'],
      note: 'Soft ⟨c⟩ was an affricate /ts/ in Old French before it simplified to /s/.',
    },
    { id: 'ofr-u', name: 'Old French vowels', rule: 'ʊ > u' },
    {
      id: 'ofr-medial-schwa',
      name: 'Reduction of unstressed vowels, reversed',
      // Old French had schwa in final position only, and Latin had none at all.
      // A medial one — the /ə/ of `-able`, `-ture` — has to go back to a full
      // vowel, and /u/ is the one standing in the Latin endings these become:
      // `-ulus`, `-ulum`, `-ūra`.
      rule: 'ə > u / _ C',
      note: 'Latin had no schwa. The vowel in endings like -able and -ture was full: `-ulum`, `-ūra`.',
    },
    { id: 'ofr-schwa', name: 'Old French final -e', rule: 'ə > ə / _ #' },
  ],
}

/** Old French → Latin, c. 100 CE. */
export const OLD_FRENCH_TO_LATIN: Stage = {
  id: 'la',
  name: 'Latin',
  period: 'c. 100 CE',
  blurb: 'Classical Latin, from which every French word descends by a chain of erosions.',
  reconstructed: false,
  confidence: 0.62,
  spell: spellLatin,
  changes: [
    {
      id: 'la-palat-a',
      name: 'Palatalisation before /a/, reversed',
      rule: 'tʃ > k',
      note: 'Latin `cantāre` → French `chanter`. Only French did this, which is why it looks so unlike Spanish.',
    },
    { id: 'la-palat-front', name: 'Palatalisation before front vowels, reversed', rule: 't s > k' },
    {
      id: 'la-sh',
      name: 'No /ʃ/ in Latin',
      rule: 'ʃ > s',
      note: 'Latin had no /ʃ/. Where French shows one it is a later palatalisation of /s/ or /sk/.',
    },
    { id: 'la-j', name: 'Fortition of /j/, reversed', rule: 'dʒ > j' },
    {
      id: 'la-lenition-p',
      name: 'Intervocalic lenition, reversed',
      rule: 'v > p / V _ V',
      note: 'Latin `rīpa` → French `rive`. Stops between vowels went soft across the whole of Western Romance.',
    },
    { id: 'la-lenition-s', name: 'Intervocalic lenition, reversed', rule: 'z > s / V _ V' },
    {
      id: 'la-diph-e',
      name: 'Stressed-vowel diphthongisation, reversed',
      rule: 'je > ɛ',
      note: 'Latin `pedem` → French `pied`. Short stressed /ɛ/ broke apart in open syllables.',
    },
    { id: 'la-diph-o', name: 'Stressed-vowel diphthongisation, reversed', rule: 'wɔ > ɔ' },
    { id: 'la-eu', name: 'Stressed-vowel diphthongisation, reversed', rule: 'ø > ɔ' },
    {
      id: 'la-ou',
      name: 'Closing of *ō, reversed',
      // Only the long vowel. Latin ū went to French /y/, so an Old French /uː/
      // is never continuing one — it is Latin ō or ŭ, closed by way of Proto-
      // Romance /o/. Short /u/ is left alone: it is what -ulum and -ūra need.
      rule: 'uː > oː',
      note: 'Latin `flōrem` → Old French `flour`, `amōrem` → `amour`, `nōs` → `nous`. The long ō closed to /u/ across Gallo-Romance.',
    },
    /*
     * French nouns descend from the Latin accusative, not the nominative, and
     * Latin had three of those. Which one is not a free choice: a French noun
     * ending in -e goes back to the first declension, and everything else to
     * the second or third. So the consonant rule fires first and the -e rule
     * second, each on the shape that actually selects it.
     */
    {
      id: 'la-accusative-3rd',
      name: 'Loss of case endings, reversed',
      rule: '∅ > e m / C _ #',
      note: 'Latin `partem`, `montem`, `flōrem`. The third declension was the largest, so a consonant-final French noun most often came through it.',
    },
    {
      id: 'la-accusative-1st',
      name: 'Loss of case endings, reversed',
      rule: 'ə > a m / _ #',
      note: 'Latin `cūram`. French -e is the first declension, and nothing else — that ending is one of the few the French form still tells you.',
    },
    {
      // Corrects the ending the consonant rule just added. Ordered after it
      // rather than before, because inserting first would leave the word ending
      // in /m/ and the consonant rule would fire on top of it.
      id: 'la-ulam',
      name: 'Loss of case endings, reversed',
      rule: 'u l e m > u l a m / _ #',
      note: 'The -le ending goes back to Latin -ula, which is first declension: `tabula`, `rēgula`, `fābula`. Not -ulem.',
    },
    {
      // Runs last so it can consume the ending the rules above added and swap in
      // the one this particular suffix actually takes.
      id: 'la-tionem',
      name: 'The -tiōnem suffix, restored',
      rule: 's i o n e m > t i oː n e m',
      note: 'Latin `nātiōnem` → Old French `nacion` → English `nation`. The /t/ went palatal, then the whole ending collapsed into one syllable.',
    },
  ],
  ambiguities: (word) => {
    const out: Ambiguity[] = []

    // A consonant-final French noun could have come through either the second
    // or the third declension, and nothing downstream records which.
    const tail = word.slice(-2).map((s) => s.p).join('')
    if (tail === 'em' || tail === 'am') {
      out.push({
        name: 'Which declension?',
        reason:
          'Latin `cantum`, `partem` and `tabulam` can all end up as the same shape in French. The ending picked here is the likeliest for this shape, but the second declension is entirely possible — `port` really is from `portum`.',
        alternative: spellLatin([...word.slice(0, -2), { p: 'u', src: '' }, { p: 'm', src: '' }]),
      })
    }

    /*
     * The reading worth showing is the opposite one for the root vowel — the
     * vowel a dictionary bothers to mark. Lengthening every /a/ instead meant
     * this note fired on words containing no /a/ at all and offered back a
     * string identical to the form printed beside it.
     */
    const v = word.findIndex((s) => isVowel(s.p))
    if (v >= 0) {
      const flipped = word.map((s, i) =>
        i === v ? { ...s, p: s.p.endsWith('ː') ? shorten(s.p) : lengthen(s.p) } : s,
      )
      const alternative = spellLatin(flipped)
      // A diphthong has no length to flip, so this can still come out unchanged.
      if (alternative !== spellLatin(word)) {
        out.push({
          name: 'Vowel length',
          reason:
            'Latin distinguished long from short vowels; French lost the distinction entirely and replaced it with quality differences. A French form cannot tell you which Latin vowel it had.',
          alternative,
        })
      }
    }

    return out
  },
}

/** Latin → Proto-Italic, c. 500 BC. */
export const LATIN_TO_PROTO_ITALIC: Stage = {
  id: 'pit',
  name: 'Proto-Italic',
  period: 'c. 500 BC',
  blurb: 'The reconstructed ancestor of Latin, Oscan and Umbrian, spoken in Italy before Rome existed.',
  reconstructed: true,
  confidence: 0.42,
  spell: spellProtoItalic,
  changes: [
    {
      id: 'pit-rhotacism',
      name: 'Rhotacism, reversed',
      rule: 'r > s / V _ V',
      note: 'Around 350 BC Latin turned every /s/ between vowels into /r/. It is why `flōs` has the stem `flōr-`, and why `honor` used to be `honōs`.',
    },
    { id: 'pit-v', name: 'Latin ⟨v⟩ was /w/', rule: 'v > w' },
    { id: 'pit-b', name: 'Medial *β → b', rule: 'b > β / V _ V' },
    {
      id: 'pit-om',
      name: 'Vowel weakening, reversed',
      rule: 'u > o / _ m #',
      note: 'Latin -um is an eroded *-om, the same ending as Greek -ον.',
    },
    { id: 'pit-os', name: 'Vowel weakening, reversed', rule: 'u > o / _ s #' },
  ],
}

/** Proto-Italic → Proto-Indo-European. */
export const PROTO_ITALIC_TO_PIE: Stage = {
  id: 'pie',
  name: 'Proto-Indo-European',
  period: 'c. 4000 BC',
  blurb:
    'The reconstructed root language of half the planet — ancestor to English, Hindi, Greek, Russian, Persian and Irish alike.',
  reconstructed: true,
  confidence: 0.3,
  spell: spellPie,
  changes: [
    {
      id: 'pit-f',
      name: 'Italic *f',
      rule: 'f > bʰ / # _',
      note: 'Latin initial f- is the regular outcome of PIE *bʰ. Latin `frāter`, English `brother`, Sanskrit `bhrātar`.',
    },
    { id: 'pit-beta', name: 'Italic *f', rule: 'β > bʰ' },
    { id: 'pit-theta', name: 'Italic *þ', rule: 'θ > dʰ' },
    { id: 'pit-chi', name: 'Italic *χ', rule: 'x > ɡʰ' },

    { id: 'pit-syll-r', name: 'Syllabic sonorants', rule: 'o r > r̩ / C _ C', note: 'Italic broke PIE syllabic sonorants with a vowel, just as Germanic did — only with a different vowel.' },
    { id: 'pit-syll-l', name: 'Syllabic sonorants', rule: 'o l > l̩ / C _ C' },
    { id: 'pit-syll-m', name: 'Syllabic sonorants', rule: 'e m > m̩ / C _ C' },
    { id: 'pit-syll-n', name: 'Syllabic sonorants', rule: 'e n > n̩ / C _ C' },
  ],
  ambiguities: (word) => {
    const out: Ambiguity[] = []

    if (word.some((s) => s.p === 'bʰ')) {
      out.push({
        name: 'Which aspirate?',
        reason:
          'Latin f- has three possible sources — PIE *bʰ, *dʰ and *gʷʰ all merged into it word-initially. *bʰ is the commonest, but the Latin form alone cannot tell you.',
        alternative: spellPie(word.map((s) => (s.p === 'bʰ' ? { ...s, p: 'dʰ' } : s))),
      })
    }

    const laryngeal: Record<string, string[]> = { aː: ['e', 'h₂'], eː: ['e', 'h₁'], oː: ['e', 'h₃'] }
    const idx = word.findIndex((s) => laryngeal[s.p])
    if (idx !== -1) {
      const expansion = laryngeal[word[idx]!.p]!
      out.push({
        name: 'Laryngeal theory',
        reason:
          'PIE long vowels usually hide a lost consonant. Saussure predicted these from internal evidence in 1879; Hittite was dug up 50 years later and still had them.',
        alternative: spellPie([
          ...word.slice(0, idx),
          ...expansion.map((p) => ({ p, src: word[idx]!.src, added: true })),
          ...word.slice(idx + 1),
        ]),
      })
    }

    if (word.some((s) => s.p === 'k' || s.p === 'ɡ')) {
      out.push({
        name: 'Which dorsal?',
        reason:
          'Latin, like Germanic, merged PIE palatal *ḱ with plain *k. Sanskrit and Slavic kept them apart — the centum/satem split.',
        alternative: spellPie(
          word.map((s) => (s.p === 'k' ? { ...s, p: 'ḱ' } : s.p === 'ɡ' ? { ...s, p: 'ǵ' } : s)),
        ),
      })
    }

    return out
  },
}

export const ROMANCE_TAIL: Stage[] = [
  MIDDLE_TO_OLD_FRENCH,
  OLD_FRENCH_TO_LATIN,
  LATIN_TO_PROTO_ITALIC,
  PROTO_ITALIC_TO_PIE,
]

/** Exported only so the UI can name what it is offering to switch to. */
export const ROMANCE_AMBIGUITIES: Ambiguity[] = []
