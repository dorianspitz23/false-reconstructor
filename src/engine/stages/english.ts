/**
 * The two stages both lineages share.
 *
 * French loanwords entered English during the Middle English period and then
 * went through the Great Vowel Shift alongside the native vocabulary — `nature`
 * and `name` shifted together. So the walk back from Modern English to Middle
 * English is the same journey whichever lineage a word belongs to, and the two
 * chains only diverge once we are standing in 1400 looking further back.
 *
 * Rules are stated backwards in time. Within a stage, order matters: a chain
 * shift has to be undone from the far end inwards, or each rule eats the output
 * of the one before it.
 */

import { spellEarlyModern, spellMiddle } from '../orthography'
import type { Stage } from '../types'

/**
 * Modern English → Early Modern English, c. 1600.
 *
 * Shakespeare's vowels, mostly. The Great Vowel Shift is underway but not
 * finished, English is still rhotic, and `knight` still has both its /k/ and
 * its /x/.
 */
export const MODERN_TO_EARLY_MODERN: Stage = {
  id: 'emode',
  name: 'Early Modern English',
  period: 'c. 1600',
  blurb: 'Shakespeare. The Great Vowel Shift is half-finished and every r is still pronounced.',
  reconstructed: false,
  confidence: 0.95,
  spell: spellEarlyModern,
  changes: [
    {
      id: 'meat-meet',
      name: 'MEAT–MEET merger, reversed',
      rule: 'iː > eː',
      srcHint: ['ea', 'ear'],
      note: '⟨ea⟩ and ⟨ee⟩ only merged around 1700. Before that, sea and see did not rhyme.',
    },
    {
      id: 'gvs-late-front',
      name: 'Great Vowel Shift, late phase',
      rule: 'eɪ > ɛː',
      note: 'Modern /eɪ/ in name was still a long monophthong /ɛː/.',
    },
    {
      id: 'gvs-late-back',
      name: 'Great Vowel Shift, late phase',
      rule: 'oʊ > oː',
      note: 'Modern /oʊ/ in stone was still a long monophthong /oː/.',
    },
    {
      id: 'gvs-diph-i',
      name: 'Great Vowel Shift, diphthongisation',
      rule: 'aɪ > əi',
      note: 'The /aɪ/ of mice was an intermediate /əi/ — halfway down from Middle English /iː/.',
    },
    {
      id: 'gvs-diph-u',
      name: 'Great Vowel Shift, diphthongisation',
      rule: 'aʊ > əu',
      note: 'The /aʊ/ of house was an intermediate /əu/.',
    },
    {
      id: 'foot-strut',
      name: 'FOOT–STRUT split, reversed',
      rule: 'ʌ > ʊ',
      note: 'cut and put still had the same vowel. Northern England never made this split.',
    },
    { id: 'trap', name: 'TRAP backing, reversed', rule: 'æ > a' },
    {
      id: 'bath-r',
      name: 'Pre-/r/ lengthening, reversed',
      rule: 'ɑ > a',
      note: 'The long vowel of `farm` is a late development. Middle English had a plain short /a/ before the /r/.',
    },
    { id: 'nurse-er', name: 'NURSE merger, reversed', rule: 'ɜ > ɛ', srcHint: ['er', 'ear'] },
    { id: 'nurse-ir', name: 'NURSE merger, reversed', rule: 'ɜ > ɪ', srcHint: ['ir'] },
    { id: 'nurse-ur', name: 'NURSE merger, reversed', rule: 'ɜ > ʊ', srcHint: ['ur'] },
    {
      id: 'nurse-rest',
      name: 'NURSE merger, reversed',
      rule: 'ɜ > ɛ',
      note: 'fern, fir and fur had three different vowels until they collapsed together c. 1600.',
    },
    {
      id: 'ng-coalescence',
      name: 'NG-coalescence, reversed',
      rule: 'ŋ > ŋ ɡ / _ #',
      note: 'sing ended in a real /ɡ/. The velar nasal was not yet its own phoneme.',
    },
    {
      id: 'gh-loss-t',
      name: 'Loss of /x/',
      rule: '∅ > x / _ t',
      srcHint: ['igh', 'ough', 'augh', 'eigh'],
      note: 'The ⟨gh⟩ was a real sound — the ch of Scottish loch.',
    },
    {
      id: 'gh-loss-final',
      name: 'Loss of /x/',
      rule: '∅ > x / _ #',
      srcHint: ['igh', 'ough', 'augh', 'eigh'],
      note: 'The ⟨gh⟩ was a real sound — the ch of Scottish loch.',
    },
    {
      id: 'wine-whine',
      name: 'WINE–WHINE merger, reversed',
      rule: 'w > h w / # _',
      srcHint: ['wh'],
      note: '⟨wh⟩ was /hw/, and still is in Scotland and parts of the American South.',
    },

    // These clusters survived into the 17th century, so they belong here rather
    // than a stage further back.
    {
      id: 'kn-cluster',
      name: 'Cluster reduction, reversed',
      rule: 'n > k n / # _',
      srcHint: ['kn'],
      note: 'knight began with a real /k/ until the 1600s. The spelling never caught up.',
    },
    { id: 'gn-cluster', name: 'Cluster reduction, reversed', rule: 'n > ɡ n / # _', srcHint: ['gn'] },
    { id: 'wr-cluster', name: 'Cluster reduction, reversed', rule: 'r > w r / # _', srcHint: ['wr'] },
    { id: 'ps-cluster', name: 'Cluster reduction, reversed', rule: 's > p s / # _', srcHint: ['ps'] },
  ],
}

/**
 * Early Modern English → Middle English, c. 1400.
 *
 * Chaucer. This is where the Great Vowel Shift gets fully unwound and the
 * silent letters of modern spelling turn back into sounds.
 */
export const EARLY_MODERN_TO_MIDDLE: Stage = {
  id: 'me',
  name: 'Middle English',
  period: 'c. 1400',
  blurb: 'Chaucer. Every letter you now write silently was pronounced, final -e included.',
  reconstructed: false,
  confidence: 0.88,
  spell: spellMiddle,
  changes: [
    // The Great Vowel Shift is a chain: each vowel rose into the slot the one
    // above it had just vacated. Unwinding it means starting at the open end,
    // or each rule would consume what the previous one produced.
    { id: 'gvs-a', name: 'Great Vowel Shift', rule: 'ɛː > aː', note: 'Middle English /aː/ raised to /ɛː/.' },
    { id: 'gvs-e-open', name: 'Great Vowel Shift', rule: 'eː > ɛː', note: 'Middle English /ɛː/ raised to /eː/.' },
    { id: 'gvs-e-close', name: 'Great Vowel Shift', rule: 'iː > eː', note: 'Middle English /eː/ raised to /iː/.' },
    { id: 'gvs-i', name: 'Great Vowel Shift', rule: 'əi > iː', note: 'Middle English /iː/ broke into a diphthong.' },
    { id: 'me-ew', name: 'Middle English /iu/', rule: 'j uː > iu', srcHint: ['ew', 'eu'] },
    { id: 'gvs-o-open', name: 'Great Vowel Shift', rule: 'oː > ɔː', note: 'Middle English /ɔː/ raised to /oː/.' },
    { id: 'gvs-o-close', name: 'Great Vowel Shift', rule: 'uː > oː', note: 'Middle English /oː/ raised to /uː/.' },
    { id: 'gvs-u', name: 'Great Vowel Shift', rule: 'əu > uː', note: 'Middle English /uː/ broke into a diphthong.' },
    { id: 'me-au', name: 'Monophthongisation, reversed', rule: 'ɔː > au', srcHint: ['au', 'aw', 'augh'] },
    { id: 'me-oi', name: 'Middle English /ɔi/', rule: 'ɔɪ > oi' },

    {
      id: 'final-e',
      name: 'Loss of final -e, reversed',
      rule: '∅ > ə / C _ #',
      srcHint: ['*e'],
      note: 'That silent -e was a spoken schwa. Chaucer scanned his lines with it.',
    },

    { id: 'me-short-u', name: 'Middle English short vowels', rule: 'ʊ > u' },
    { id: 'me-short-i', name: 'Middle English short vowels', rule: 'ɪ > i' },
    { id: 'me-short-e', name: 'Middle English short vowels', rule: 'ɛ > e' },
    { id: 'me-short-o', name: 'Middle English short vowels', rule: 'ɒ > o' },
    { id: 'me-short-open-o', name: 'Middle English short vowels', rule: 'ɔ > o' },
    { id: 'me-zh', name: 'No /ʒ/ in Middle English', rule: 'ʒ > z' },
  ],
}
