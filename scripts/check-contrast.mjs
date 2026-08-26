/**
 * Checks every foreground/background pair in the palette against WCAG 2.1.
 *
 * The palette is authored in OKLCH, which is perceptually uniform but says
 * nothing directly about WCAG contrast — that is defined on sRGB relative
 * luminance. So this converts properly rather than eyeballing it.
 *
 *     node scripts/check-contrast.mjs
 */

import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** OKLCH → linear sRGB, via OKLab. Björn Ottosson's published matrices. */
function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** WCAG relative luminance wants linear-light values, which we already have. */
function luminance(L, C, h) {
  const [r, g, b] = oklchToLinearSrgb(L, C, h).map((v) => Math.min(Math.max(v, 0), 1))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(fg, bg) {
  const a = luminance(...fg)
  const b = luminance(...bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

const css = await readFile(resolve(ROOT, 'src/styles.css'), 'utf8')

/** Pull the OKLCH custom properties straight out of the stylesheet. */
const palette = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g)].map(
    ([, name, l, c, h]) => [name, [Number(l) / 100, Number(c), Number(h)]],
  ),
)

// Every pair that actually carries text or a meaningful boundary, with the
// threshold that applies to it: 4.5 for body copy, 3.0 for large text and UI.
const PAIRS = [
  ['ink', 'vellum', 4.5, 'body text'],
  ['ink-soft', 'vellum', 4.5, 'secondary prose, notes, italics'],
  ['ink-faint', 'vellum', 4.5, 'disclosure labels, inactive toggle'],
  ['vermilion', 'vellum', 4.5, 'rubrics, marginal dates, primary button'],
  ['ultramarine', 'vellum', 4.5, 'alternating paraph marks'],
  ['ink', 'vellum-deep', 4.5, 'gloss body'],
  ['ink-soft', 'vellum-deep', 4.5, 'gloss reason'],
  ['vermilion', 'vellum-deep', 4.5, 'gloss heading, manicule'],
  ['gold', 'vellum', 3.0, 'the asterisk — large display text only'],
  ['rule', 'vellum', 1.0, 'hairlines — decorative, no threshold'],
]

let failures = 0
console.log('pair'.padEnd(34) + 'ratio'.padStart(7) + '  need   ' + 'role')
console.log('-'.repeat(92))

for (const [fg, bg, need, role] of PAIRS) {
  if (!palette[fg] || !palette[bg]) {
    console.log(`${`${fg} on ${bg}`.padEnd(34)}  MISSING FROM PALETTE`)
    failures += 1
    continue
  }
  const ratio = contrast(palette[fg], palette[bg])
  const ok = ratio >= need
  if (!ok) failures += 1
  console.log(
    `${`${fg} on ${bg}`.padEnd(34)}${ratio.toFixed(2).padStart(7)}  ${String(need).padEnd(6)} ${ok ? 'PASS' : 'FAIL'}  ${role}`,
  )
}

console.log('-'.repeat(92))
console.log(failures === 0 ? 'All pairs pass.' : `${failures} pair(s) below threshold.`)
process.exit(failures === 0 ? 0 : 1)
