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
- aspect ratios differ by no more than 1.5%;
- RGB mean absolute error is no more than 25%.

Rejected pairs remain in the generated ledger with their reason. They are not
silently discarded.

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

Screenshots and measurements were captured in daily batches, not after every
one of the 615 commits in the interval. The chart therefore has one evidence
point per day and binds it to:

- the final commit of that day;
- the number of commits included since the previous point;
- the new and cumulative story counts;
- accepted and rejected visual pairs;
- active reliability events.

Interpolating a score for every commit would claim evidence that does not
exist. Future runs can add commit-level points when the same capture matrix is
executed at those commits.

## Interpretation

- A falling line means the weighted evidence gap decreased.
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
