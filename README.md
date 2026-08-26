# False *Reconstructor

**Type a word English never had. Watch real historical sound laws run backwards through it — Early Modern English, Middle English, Old English, Proto-West Germanic, Proto-Germanic, all the way to Proto-Indo-European.**

There is no AI in this repository. Every form is produced by applying documented sound changes in reverse, in order, to a phoneme string. The same word always gives the same answer, and every step names the law that produced it.

> **flarn** → *flarn* (1600) → *flarn* (1400) → **flærn** (900) → **\*flarna** (400) → **\*flarnaz** (1 CE) → **\*plórnos-** (4000 BC)

---

## Why rules and not a language model

This was [asked for on r/SomebodyMakeThis](https://www.reddit.com/r/SomebodyMakeThis/comments/1vq0snc/false_reconstructor/). The top reply was "just ask an AI to make up a fake etymology." The person who asked said no — they wanted it done "with linguistic evolution features," and the reply was that there are no universal rules, so a neural net is the only way.

They were right and the reply was wrong. Sound change is the most regular thing in historical linguistics: the **Neogrammarian hypothesis** — that sound laws apply without exception in a given time and place — is what makes the comparative method work at all. Grimm's Law is not a vibe. It is a table, and it has been a table since 1822.

So this is a table. 126 of them, plus 102 rules for turning spelling into sound.

The difference matters in practice, not just in principle:

|                       | Rule engine (this)                     | Asking a chatbot                       |
| --------------------- | -------------------------------------- | -------------------------------------- |
| Same word twice       | Same answer, always                     | Different answer each time              |
| Why this form?        | Names the law, shows the before/after   | "It looks plausible"                    |
| Wrong output          | A rule is wrong; fix it once, for good  | Reroll and hope                         |
| Unresolvable step     | Says so, and shows both readings        | Picks one, silently                     |
| Runs                  | Offline, in a browser tab, instantly    | Needs a server and an API key           |

## Does it actually work?

The honest test for a tool aimed at words that don't exist is to feed it words that do, and see whether it lands on their recorded histories. It has never seen a dictionary — these come out of the sound laws alone:

| You type  | Engine says              | Actually attested          |
| --------- | ------------------------ | -------------------------- |
| `ship`    | OE **scip**              | OE *scip* ✅                |
| `knight`  | OE **cnīht**             | OE *cnīht* ✅               |
| `foot`    | OE **fōt**               | OE *fōt* ✅                 |
| `nation`  | Latin **nātiōnem**       | Latin *nātiōnem* ✅         |
| `stone`   | OE **stāne**, PG **\*stainiz** | OE *stān*, PG *\*stainaz* |
| `mouse`   | OE **mūse**, PG **\*mūsiz**    | OE *mūs*, PG *\*mūs*      |
| `heart`   | PIE **\*ḱérdos-**         | PIE *\*ḱerd-*              |
| `father`  | PIE **\*póteros-**        | PIE *\*ph₂tḗr*             |

Four exact hits, and the rest differ only in the inflectional ending — which for a word that never existed is unknowable anyway, and which the app tells you it is guessing at. Grimm's Law comes out right every time: `f` → `*p` (father/pater), `θ` → `*t` (three/trēs), `h` → `*k` (heart/cordis).

This is the whole reason to build it with rules. You can grade it.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 83 tests
npm run build
```

## How it works

Five steps, each a separate module.

**1. Spelling → sound** (`src/engine/g2p.ts`). A dictionary is useless for a word that doesn't exist, so the letters are converted to phonemes by rule: longest grapheme first, with the handful of context conditions English orthography actually obeys (magic-e, open syllables, soft *c* and *g*, final *-ng*).

Every phoneme keeps the letters it came from. This matters more than it looks — **English spelling is a century or two behind English speech, so the letters routinely preserve distinctions the sounds have merged**. `⟨ea⟩` and `⟨ee⟩` are both /iː/ today, but they come from different Middle English vowels, and only the spelling still knows which is which. The engine uses that.

**2. Pick a lineage** (`src/engine/classify.ts`). English has two vocabularies wearing one coat. `knurst` looks native; `flabricity` looks borrowed. A weighted cue table decides, explains itself in one sentence, and can be overridden with one click.

**3. Run the laws backwards** (`src/engine/rules.ts`, `src/engine/stages/`). Each stage owns an ordered list of sound changes, written in the notation historical linguists actually use:

```
k > x / _ t          k becomes x before t
ə > ∅ / _ #          schwa is lost word-finally
V N > %1ː / _ F      vowel + nasal becomes a long vowel before a fricative
```

**Order is the whole game.** A chain shift has to be unwound from the far end inwards, or each rule eats the output of the one before it. Reversing the Great Vowel Shift means undoing /ɛː/ → /aː/ *before* /eː/ → /ɛː/, or every vowel collapses into one. Grimm's Law is undone in three passes for the same reason — voiced stops become aspirates first, then voiceless become voiced, then fricatives become voiceless. Do it in the intuitive order and every consonant in the language turns into the same consonant.

**4. Spell it properly** (`src/engine/orthography.ts`). Not transcription — the spelling each tradition actually uses. Old English gets its macrons, thorns and ash. Proto-Germanic gets the `*stainaz` shape you'd see on Wiktionary. PIE gets laryngeals, the three-way dorsal contrast, and an acute accent.

**5. Admit what you don't know.** Some steps genuinely cannot be decided from the evidence, and the app shows both readings instead of picking one quietly:

- **Verner's Law** — whether a Germanic consonant came out voiced depended on where the PIE accent sat, and an invented root has no accent to recover.
- **PIE \*o or \*a** — Germanic merged them. Nothing downstream can pull them apart.
- **Laryngeals** — a PIE long vowel usually hides a lost consonant that survives directly only in Hittite.
- **Which dorsal** — Germanic and Latin both merged palatal *\*ḱ* with plain *\*k*. Sanskrit didn't.
- **Which ending** — Old English *-e*, *-a* and *-u* all fell together as Middle English *-e*.

## What's actually in here

Sound laws implemented, by stage:

| Stage | Period | Includes |
| --- | --- | --- |
| Early Modern English | c. 1600 | Great Vowel Shift (late), MEAT–MEET merger, FOOT–STRUT split, NURSE merger, NG-coalescence, loss of /x/, WINE–WHINE merger, *kn-/gn-/wr-* clusters |
| Middle English | c. 1400 | Great Vowel Shift (full), loss of final *-e*, monophthongisation |
| Old English | c. 900 | Open-syllable lengthening, /aː/ rounding, ǣ and æ, unstressed-vowel reduction |
| Proto-West Germanic | c. 400 | i-mutation, breaking, palatalisation, Anglo-Frisian brightening, loss of final vowels, rhotacism *(flagged)* |
| Proto-Germanic | c. 1 CE | Loss of final *\*-z*, *\*ē₁* → *\*ā*, fortition of *\*đ* |
| Proto-Indo-European | c. 4000 BC | **Grimm's Law** + the /s/ exception, syllabic sonorants, vowel mergers, Verner's Law *(flagged)*, laryngeals *(flagged)* |
| Old French → Latin → Proto-Italic | c. 1200 → 500 BC | Palatalisation, intervocalic lenition, diphthongisation, loss of case endings, the *-tiōnem* suffix, **rhotacism** |

## Adding a sound change

The rules are data, in `src/engine/stages/`. To add one:

```ts
{
  id: 'my-change',
  name: 'The Law of Whatever',
  rule: 'x > k / _ t',        // reverse direction — we walk backwards
  srcHint: ['igh'],           // optional: only when the spelling agrees
  note: 'Shown to the reader in the derivation trace.',
}
```

Then put it in the right **position in the list** — that is where most of the linguistics lives. A test in `tests/engine.test.ts` that pins a real word's attested outcome is the best way to prove it helped.

For the rare change that needs syllable structure rather than a neighbouring segment (open-syllable lengthening is the only one so far), swap `rule` for `apply: (word) => word`.

## Honest limits

- **The two chains are the two big ones.** Greek, Norse and Celtic borrowings all get routed down Germanic or Latinate.
- **Grapheme-to-phoneme is rules, not a dictionary,** so a spelling English never settled on (`ough`) gets one reading where a real word might have five.
- **Stress is assumed root-initial** in PIE. Real PIE accent was mobile, which is exactly why Verner's Law is flagged rather than applied.
- **Semantics are not modelled at all.** This tells you what a word would have *sounded* like, never what it would have *meant*.
- **Depth costs confidence,** and the app shows it — forms fade as the dates get older, because a 6th-order reconstruction of a word that never existed is a joke with a bibliography, not a finding.

## Licence

MIT. Idea from [u/Scared_Marionberry70 on r/SomebodyMakeThis](https://www.reddit.com/r/SomebodyMakeThis/comments/1vq0snc/false_reconstructor/), who wanted it done with rules and was right to.
