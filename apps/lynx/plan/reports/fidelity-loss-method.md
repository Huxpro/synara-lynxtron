# Fidelity loss ledger

This document defines the reproducible loss model shown in the high-fidelity
work review. The score summarizes evidence; it does not replace the underlying
screenshots, geometry, runtime logs, or residual audit.

## Unit of work

One scope unit is a discovered screen-state story:

`screen × route × theme × viewport × interaction state`

Client subdirectories and files belonging to the same story are merged. A
continuous diagnostic sequence counts as one story, not one story per frame.
This prevents the 744 Native flicker frames from manufacturing artificial
coverage.

The current historical scope contains 379 stories and 1,856 images.

## Per-loop browser lifecycle invariant

Every discovery, fast, and Native loop begins and ends with
`bun run browser:gate`, even when that loop does not intend to use a browser.
The gate runs the ownership cleanup and then an independently wrapped
`agent-browser session list --json` proof. Any command sequence that can invoke
`agent-browser` runs wholly inside `bun run browser:run -- ...`.

A loop is not closed until both conditions are observed:

- `agent-browser session list --json` reports `sessions: []`;
- the repository cleanup script reports zero agent-browser-owned daemon or
  browser processes.

Any remainder is classified as harness loss, not product loss. It blocks
retained evidence, commit, push, and the next loop until cleanup succeeds. The
ownership filter must never terminate unrelated Chrome or remote-debugging
processes.

Timeouts, interruptions, failed scripts, failed probes, malformed helpers, and
tool failures are intermediate loop exits for this invariant. Run
`bun run browser:gate` before issuing any next browser command; do not defer the
independent double-zero proof until the nominal end of the loop.

## Equation

```text
Loss = 100 × (
  0.30 × scopeGap
  + 0.25 × clientGap
  + 0.35 × visualDistance
  + 0.10 × reliabilityDebt
)
```

Lower is better. Every component is independently bounded to `[0, 1]`.

### Scope gap

```text
scopeGap = 1 - cumulativeDiscoveredStories / finalKnownStories
```

This uses the final known scope as a retrospective denominator. The chart
therefore answers “how much of the work we eventually discovered had been
covered by this point?” It must not be interpreted as a contemporaneous
completion promise.

### Client gap

For an ordinary story, Web, Lynx-for-Web, and Native are three expected cells.
The component is:

```text
clientGap = 1 - observedClientCells / expectedClientCells
```

Pure diagnostic sequences have one expected evidence cell. This avoids
penalizing a CoreGraphics frame sequence for not having synthetic Web and Lynx
copies.

### Visual distance

Only demonstrably comparable pairs enter the visual term:

- Web ↔ Lynx-for-Web or Lynx-for-Web ↔ Native;
- filenames normalize to the same state identity;
- aspect ratios differ by no more than 1.5%.

The comparability gate recognizes the audited Native DPR2/titlebar mappings:
`1280×820 ↔ 2560×1640`, `1280×820 ↔ 2560×1576`, and their 1440px
equivalents. This prevents the 32 logical pixel Native titlebar correction from
being mislabeled as an unrelated crop.

Rejected pairs remain in the generated ledger with their reason. They are not
silently discarded.

High MAE is not a rejection reason. A structurally comparable pair remains in
the loss even when parity is very poor:

- `<3%` MAE: close;
- `3–10%`: noticeable;
- `10–25%`: poor;
- `>=25%`: critical.

The UI reports both `MAE` and `parity = max(0, 100 - MAE)`.

Before a high-MAE pair enters product visual distance, the generator checks
capture-state consistency when both sides provide assertions:

- declared theme and snapshot identity;
- rendered luminance classification (`light`, `dark`, or `mixed`);
- viewport metadata.

If both assertions declare the same theme but one image is overwhelmingly dark
and the other overwhelmingly light, the pair is classified as
`capture-theme-mismatch`. It is excluded from product visual distance and
charged to the harness/reliability ledger until a synchronized recapture closes
the issue. The original images, declarations, luminance statistics, detection
commit, resolution commits, and later parity range remain visible in the
commit-level ledger.

For accepted pairs:

```text
observedVisualLoss = clamp(median(RGB_MAE_percent) / 10, 0, 1)
confidence = clamp(acceptedPairCount / 12, 0, 1)
visualDistance =
  confidence × observedVisualLoss
  + (1 - confidence) × 0.50
```

The median prevents one outlier from controlling a day. Sparse days shrink
toward a neutral 50% prior instead of appearing excellent because of one easy
pair.

### Reliability debt

Reliability is an explicit commit-bounded ledger, not keyword sentiment:

- viewport hydration race and duplicate resize subscriptions;
- titlebar controls participating in the drag region;
- Explorer preview initialization crashing Native startup.

Each event has an introducing commit, an optional fixing commit, and severity
points. The daily end-of-day point includes only events active at that commit.

## Time and commit binding

The interval contains 615 commits. Of those, 291 are evidence-bearing or
reliability-event commits:

- a screenshot, metric, note, or generated evidence artifact was added or
  updated; or
- a commit introduced or fixed an explicitly registered regression.

Each of those commits has a measured loss point. A story, client cell, or visual
pair activates only when the corresponding files first enter Git. A reliability
event activates and deactivates at its exact introducing and fixing commits.

The chart also retains ten end-of-day anchors for readable labels. They are
derived from the same commit-point ledger.

The thick trend line is an exponential moving average with `alpha=0.18`. It is
a display aid over measured commit points, not interpolated evidence and not
the value used by the audit ledger.

## Rise attribution

For every commit where observed loss rises by more than `0.01`, the generator
computes:

```text
componentContribution =
  (currentComponent - previousComponent) × componentWeight × 100
```

The resulting explanation records:

- positive and countervailing component contributions;
- newly discovered stories and client expectations;
- visual pairs entering the 24-pair rolling window;
- reliability events introduced or fixed at that commit.

This distinguishes a true regression from a scope-expansion rise or a visual
sample-window change. The rise list links back to the exact commit and evidence
day.

## Interpretation

- A falling measured line means the weighted evidence gap decreased.
- The EMA communicates the trend without erasing measured rises.
- A temporary rise can be legitimate when new scope exposes defects or a
  functional regression lands.
- `bestLoss` records the best value reached so far without rewriting the
  observed daily value into a monotonic curve.
- The current score is not “percent complete” and is not sufficient by itself
  to certify parity.

## Reproduction

```sh
node apps/lynx/scripts/generate-screenshot-archive.mjs
node apps/lynx/scripts/generate-fidelity-loss.mjs
node --test apps/lynx/scripts/fidelity-loss.logic.test.mjs
```

Generated artifacts:

- `shots/2026-08-04/p10-perceptual-fidelity/fidelity-loss.json`
- `shots/2026-08-04/p10-perceptual-fidelity/fidelity-loss.js`

The JSON contains the full input ledger, including accepted and rejected pairs.

Screenshot bytes are hosted publicly in
`https://github.com/Huxpro/synara-fidelity-assets`. The main repository keeps
only `screenshot-assets.json` metadata. Loss regeneration downloads required
pairs into a process-scoped temporary directory with retry/backoff and removes
the cache on exit; it does not restore screenshots into the checkout.
