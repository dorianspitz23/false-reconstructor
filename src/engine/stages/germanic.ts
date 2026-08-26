/**
 * The Germanic lineage: Middle English back to Proto-Indo-European.
 *
 *   Middle English → Old English → Proto-West Germanic → Proto-Germanic → PIE
 *
 * This is the chain for the native core of the language — the words that were
 * already here when the Angles and Saxons arrived, and that go back through
 * Grimm's Law to a language spoken on the Pontic steppe around 4000 BC.
 */

import { inOpenSyllable, isVowel } from '../phonology'
import {
  spellOldEnglish,
  spellPie,
  spellProtoGermanic,
  spellProtoWestGermanic,
} from '../orthography'
import type { Ambiguity, Stage, Word } from '../types'

/**
 * Middle English open-syllable lengthening, reversed.
 *
 * In the 13th century short /a e o/ stretched out when they stood in an open
 * syllable — Old English `nama` became Middle English `nāme`. It needs syllable
 * structure rather than a neighbouring segment, so it does not fit the rule
 * notation.
 */
function undoOpenSyllableLengthening(word: Word): Word {
  const vowels = word.filter((s) => isVowel(s.p)).length
  if (vowels < 2) return word

  return word.map((seg, i) => {
    // /ɔː/ is deliberately excluded. It is the regular Middle English reflex of
    // Old English long ā (stān → stoon → stone), which is a far commoner source
    // than lengthened short /o/ — so it is handled by the ā rule below instead.
    if (!['aː', 'eː', 'ɛː'].includes(seg.p)) return seg
    if (!inOpenSyllable(word, i)) return seg
    return { ...seg, p: seg.p.slice(0, -1) }
  })
}

/** Middle English → Old English, c. 900. */
export const MIDDLE_TO_OLD_ENGLISH: Stage = {
  id: 'oe',
  name: 'Old English',
  period: 'c. 900',
  blurb: 'Beowulf. A fully inflected Germanic language, closer to Icelandic than to English.',
  reconstructed: false,
  confidence: 0.78,
  spell: spellOldEnglish,
  changes: [
    {
      id: 'osl',
      name: 'Open-syllable lengthening, reversed',
      apply: undoOpenSyllableLengthening,
      note: 'Short vowels stretched out in open syllables around 1200. Old English `nama` → Middle English `nāme`.',
    },
    {
      id: 'oe-long-a',
      name: 'Old English /aː/ rounding, reversed',
      rule: 'ɔː > aː',
      note: 'Old English `stān` became Middle English `stoon`, then Modern `stone`.',
    },
    { id: 'oe-ae-long', name: 'Old English ǣ', rule: 'ɛː > æː' },
    { id: 'oe-ae-short', name: 'Old English æ', rule: 'a > æ' },
    { id: 'oe-aw', name: 'Old English /ɣ/ vocalisation, reversed', rule: 'au > a ɣ' },
    { id: 'oe-eow', name: 'Old English ēo', rule: 'iu > eoː' },
    {
      id: 'oe-final-vowel',
      name: 'Reduction of unstressed vowels, reversed',
      // Every position, not just word-final: the schwa in `grimble` is medial,
      // and Old English had no schwa anywhere — `æppel`, `fugol`, `setl` all
      // carried a full vowel until Middle English levelled them.
      rule: 'ə > e',
      note: 'Old English had a full set of unstressed vowels. They all collapsed to schwa, then most of them vanished.',
    },
    { id: 'oe-ng', name: 'Old English wrote /ŋ/ as n', rule: 'ŋ > n' },
  ],
  ambiguities: (word) => {
    const out: Ambiguity[] = []
    const last = word[word.length - 1]
    if (last && last.p === 'e') {
      out.push({
        name: 'Which ending?',
        alternative: spellOldEnglish(word.slice(0, -1)) + 'a',
        reason:
          'Old English -e, -a and -u all fell together as Middle English -e. Without knowing the gender and declension of a word that never existed, the ending is a coin toss.',
      })
    }
    return out
  },
}

/** Old English → Proto-West Germanic, c. 400. */
export const OLD_ENGLISH_TO_PWG: Stage = {
  id: 'pwg',
  name: 'Proto-West Germanic',
  period: 'c. 400',
  blurb: 'The unattested ancestor of English, Dutch, German and Frisian, spoken around the North Sea.',
  reconstructed: true,
  confidence: 0.6,
  spell: spellProtoWestGermanic,
  changes: [
    // i-mutation: a following /i/ or /j/ dragged the stressed vowel forward in
    // the mouth, then usually deleted itself, leaving the alternation behind.
    // It is why English still says foot/feet and mouse/mice.
    { id: 'imut-y', name: 'i-mutation, reversed', rule: 'y > u', note: 'Old English /y/ is a fronted /u/ — the cause was a lost /i/ in the next syllable.' },
    { id: 'imut-y-long', name: 'i-mutation, reversed', rule: 'yː > uː' },
    { id: 'imut-oe', name: 'i-mutation, reversed', rule: 'øː > oː' },
    { id: 'imut-ie-long', name: 'i-mutation, reversed', rule: 'ieː > iu' },
    { id: 'imut-ie', name: 'i-mutation, reversed', rule: 'ie > iu' },

    // Breaking: a front vowel grew a back glide before /r l x/ + consonant.
    { id: 'breaking-ea', name: 'Breaking, reversed', rule: 'æa > æ / _ [r l x]', note: 'Old English `eall` from earlier `all` — the vowel broke before /l/.' },
    { id: 'breaking-eo', name: 'Breaking, reversed', rule: 'eo > e / _ [r l x]' },

    // Old English long diphthongs go back to plain Germanic ones.
    { id: 'oe-ea-long', name: 'Old English ēa', rule: 'æaː > au' },
    { id: 'oe-eo-long', name: 'Old English ēo', rule: 'eoː > eu' },

    // Palatalisation: velars in front of front vowels turned into affricates,
    // which is why `church` and `kirk` are the same word by different routes.
    { id: 'palat-c', name: 'Palatalisation, reversed', rule: 'tʃ > k', note: 'Old English `ċild` had a /k/ before it had a /tʃ/.' },
    { id: 'palat-g', name: 'Palatalisation, reversed', rule: 'dʒ > ɡ' },
    { id: 'palat-sc', name: 'Palatalisation, reversed', rule: 'ʃ > s k', note: 'Old English `sc` was /sk/ — `scip` before it was `ship`.' },

    // `ai` has to be restored before ǣ lowers into the same slot.
    { id: 'pwg-ai', name: 'Monophthongisation, reversed', rule: 'aː > ai', note: 'Proto-Germanic *ai flattened to Old English ā: *stain → stān → stone.' },
    { id: 'af-bright-long', name: 'Anglo-Frisian brightening, reversed', rule: 'æː > aː' },
    { id: 'af-bright', name: 'Anglo-Frisian brightening, reversed', rule: 'æ > a', note: 'Germanic /a/ fronted to /æ/ in Old English and Frisian only — one of the changes that split them off from German.' },

    { id: 'pwg-h', name: 'Initial /x/ weakening, reversed', rule: 'h > x / # _' },
    { id: 'pwg-v', name: 'Fricative allophones', rule: 'v > β' },
    { id: 'pwg-z', name: 'Fricative allophones', rule: 'z > s' },

    {
      id: 'pwg-final-i',
      name: 'Loss of final vowels, reversed',
      rule: 'e > i / _ #',
    },
    {
      id: 'pwg-thematic',
      name: 'Loss of final vowels, reversed',
      rule: '∅ > a / C _ #',
      note: 'Restores the stem vowel. Germanic nouns were built from a root plus a theme vowel, and English has since worn every one of them off.',
    },
  ],
  ambiguities: (word) => {
    const out: Ambiguity[] = []
    if (word.some((s) => s.p === 'r')) {
      out.push({
        name: 'Rhotacism',
        reason:
          'West Germanic turned /z/ into /r/ between vowels, so an /r/ here could go back to Proto-Germanic *z instead — the same alternation that gave English was/were.',
        alternative: spellProtoWestGermanic(
          word.map((s) => (s.p === 'r' ? { ...s, p: 'z' } : s)),
        ),
      })
    }
    return out
  },
}

/** Proto-West Germanic → Proto-Germanic, c. 1 CE. */
export const PWG_TO_PROTO_GERMANIC: Stage = {
  id: 'pg',
  name: 'Proto-Germanic',
  period: 'c. 1 CE',
  blurb: 'The common ancestor of English, German, Dutch, Norse and Gothic. Reconstructed, never written.',
  reconstructed: true,
  confidence: 0.5,
  spell: spellProtoGermanic,
  changes: [
    {
      id: 'pg-final-z',
      name: 'Loss of final *-z, reversed',
      rule: '∅ > z / [a i u] _ #',
      note: 'Proto-Germanic marked the nominative singular with *-z. West Germanic dropped it; Norse turned it into -r.',
    },
    {
      id: 'pg-e1',
      name: 'Proto-Germanic *ē₁ → *ā',
      rule: 'aː > eː',
      note: 'West Germanic lowered the long *ē to *ā. Gothic kept it, which is how we know it was there.',
    },
    { id: 'pg-d', name: 'Fortition of *đ, reversed', rule: 'd > ð / V _' },
  ],
}

/**
 * Proto-Germanic → Proto-Indo-European.
 *
 * The deepest step, and the one that turns the whole consonant system inside
 * out. Grimm's Law is the reason `father` and `pater` are the same word.
 */
export const PROTO_GERMANIC_TO_PIE: Stage = {
  id: 'pie',
  name: 'Proto-Indo-European',
  period: 'c. 4000 BC',
  blurb:
    'The reconstructed root language of half the planet — ancestor to English, Hindi, Greek, Russian, Persian and Irish alike.',
  reconstructed: true,
  confidence: 0.3,
  spell: spellPie,
  changes: [
    // Stops after /s/ were exempt from Grimm's Law. They are parked under a
    // marker symbol while the shift is undone, then restored below. The marker
    // must not collide with a phoneme-class letter — `K` is the velar class.
    { id: 'sp-shield', name: 'The /s/ exception to Grimm’s Law', rule: 's p > s pˢ' },
    { id: 'st-shield', name: 'The /s/ exception to Grimm’s Law', rule: 's t > s tˢ' },
    { id: 'sk-shield', name: 'The /s/ exception to Grimm’s Law', rule: 's k > s kˢ' },

    // Sonorants could carry a syllable on their own in PIE.
    { id: 'syll-n', name: 'Syllabic sonorants', rule: 'u n > n̩ / C _ C', note: 'PIE had consonants that could act as vowels. Germanic broke them up with a /u/.' },
    { id: 'syll-m', name: 'Syllabic sonorants', rule: 'u m > m̩ / C _ C' },
    { id: 'syll-r', name: 'Syllabic sonorants', rule: 'u r > r̩ / C _ C' },
    { id: 'syll-l', name: 'Syllabic sonorants', rule: 'u l > l̩ / C _ C' },

    // Grimm's Law, undone from the far end of the chain inwards.
    { id: 'grimm-b', name: 'Grimm’s Law', rule: 'β > bʰ', note: 'PIE breathy-voiced *bʰ became a plain Germanic /b/.' },
    { id: 'grimm-d', name: 'Grimm’s Law', rule: 'ð > dʰ' },
    { id: 'grimm-g', name: 'Grimm’s Law', rule: 'ɣ > ɡʰ' },
    { id: 'grimm-b2', name: 'Grimm’s Law', rule: 'b > bʰ' },
    { id: 'grimm-d2', name: 'Grimm’s Law', rule: 'd > dʰ' },
    { id: 'grimm-g2', name: 'Grimm’s Law', rule: 'ɡ > ɡʰ' },
    { id: 'grimm-gw', name: 'Grimm’s Law', rule: 'ɡʷ > ɡʷʰ' },

    { id: 'grimm-p', name: 'Grimm’s Law', rule: 'p > b', note: 'PIE *b became Germanic /p/ — the rarest sound in the parent language.' },
    { id: 'grimm-t', name: 'Grimm’s Law', rule: 't > d' },
    { id: 'grimm-k', name: 'Grimm’s Law', rule: 'k > ɡ' },
    { id: 'grimm-kw', name: 'Grimm’s Law', rule: 'kʷ > ɡʷ' },

    { id: 'grimm-f', name: 'Grimm’s Law', rule: 'f > p', note: 'PIE *p became Germanic /f/. Latin `pater`, English `father`.' },
    { id: 'grimm-th', name: 'Grimm’s Law', rule: 'θ > t', note: 'PIE *t became Germanic /θ/. Latin `trēs`, English `three`.' },
    { id: 'grimm-h', name: 'Grimm’s Law', rule: 'x > k', note: 'PIE *k became Germanic /x/, later /h/. Latin `centum`, English `hundred`.' },
    { id: 'grimm-hw', name: 'Grimm’s Law', rule: 'xʷ > kʷ' },

    {
      id: 'sp-restore',
      name: 'The /s/ exception to Grimm’s Law',
      rule: 'pˢ > p',
      note: 'After /s/, PIE voiceless stops came through Germanic untouched — which is why English has `star` and not `*sthar`.',
    },
    { id: 'st-restore', name: 'The /s/ exception to Grimm’s Law', rule: 'tˢ > t' },
    { id: 'sk-restore', name: 'The /s/ exception to Grimm’s Law', rule: 'kˢ > k' },

    { id: 'pie-o', name: 'Germanic vowel mergers, reversed', rule: 'a > o', note: 'PIE *o and *a both fell together as Germanic /a/. *o was far more common, so it is the better bet.' },
    { id: 'pie-a-long', name: 'Germanic vowel mergers, reversed', rule: 'oː > aː', note: 'PIE *ā raised to Germanic *ō.' },
    { id: 'pie-oi', name: 'Germanic vowel mergers, reversed', rule: 'ai > oi' },
    { id: 'pie-ou', name: 'Germanic vowel mergers, reversed', rule: 'au > ou' },
    { id: 'pie-s', name: 'Final *-s', rule: 'z > s / _ #', note: 'Germanic *-az is PIE *-os — the same ending as Greek -ος and Latin -us.' },
  ],
  ambiguities: (word) => {
    const out: Ambiguity[] = []

    // Verner's Law: whether a Germanic obstruent came out voiced depended on
    // where the PIE accent sat, and a nonce root gives no evidence for that.
    const vernerMap: Record<string, string> = { bʰ: 'p', dʰ: 't', ɡʰ: 'k' }
    const hasNonInitialAspirate = word.some((s, i) => i > 0 && vernerMap[s.p])
    if (hasNonInitialAspirate) {
      out.push({
        name: "Verner's Law",
        reason:
          'Germanic voiced these consonants only when the PIE accent fell *after* them. Move the accent and you get a plain voiceless stop instead — the same split that gives English was/were and death/dead.',
        alternative: spellPie(
          word.map((s, i) => (i > 0 && vernerMap[s.p] ? { ...s, p: vernerMap[s.p]! } : s)),
        ),
      })
    }

    // The commonest judgement call in the whole derivation: Germanic collapsed
    // two PIE vowels into one, and nothing downstream can pull them apart.
    if (word.some((s) => s.p === 'o')) {
      out.push({
        name: 'PIE *o or *a?',
        reason:
          'Germanic merged PIE *o and *a into a single /a/. *o was far commoner in the parent language, so it is the better bet — but Germanic evidence alone cannot separate them. Latin and Greek kept them apart.',
        alternative: spellPie(word.map((s) => (s.p === 'o' ? { ...s, p: 'a' } : s))),
      })
    }

    // Laryngeals: PIE long vowels are usually a short vowel plus a lost
    // consonant that survives directly only in Hittite.
    const laryngeal: Record<string, string[]> = {
      aː: ['e', 'h₂'],
      eː: ['e', 'h₁'],
      oː: ['e', 'h₃'],
    }
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

    // The centum/satem split: Germanic merged two of PIE's three dorsal series.
    if (word.some((s) => s.p === 'k' || s.p === 'ɡ' || s.p === 'ɡʰ')) {
      out.push({
        name: 'Which dorsal?',
        reason:
          'PIE had three k-like series — palatal *ḱ, plain *k and labiovelar *kʷ. Germanic merged the first two, so a /k/ here is equally likely to have been *ḱ. Sanskrit and Slavic kept them apart.',
        alternative: spellPie(
          word.map((s) =>
            s.p === 'k' ? { ...s, p: 'ḱ' } : s.p === 'ɡ' ? { ...s, p: 'ǵ' } : s.p === 'ɡʰ' ? { ...s, p: 'ǵʰ' } : s,
          ),
        ),
      })
    }

    return out
  },
}

export const GERMANIC_TAIL: Stage[] = [
  MIDDLE_TO_OLD_ENGLISH,
  OLD_ENGLISH_TO_PWG,
  PWG_TO_PROTO_GERMANIC,
  PROTO_GERMANIC_TO_PIE,
]
