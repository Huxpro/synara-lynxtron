import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateFidelityLoss,
  median,
  normalizeEvidenceName,
  visualLossFromSamples,
} from './fidelity-loss.logic.mjs';

test('normalizes paired client filenames without erasing state identity', () => {
  assert.equal(normalizeEvidenceName('web-light.png'), 'light');
  assert.equal(normalizeEvidenceName('lynx-light.png'), 'light');
  assert.equal(normalizeEvidenceName('native.png'), 'raw');
  assert.equal(normalizeEvidenceName('open-final-web.png'), 'open-final');
});

test('calculates robust medians', () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
});

test('shrinks sparse visual samples toward a neutral prior', () => {
  assert.deepEqual(visualLossFromSamples([]), {
    loss: 0.5,
    confidence: 0,
    medianPercent: null,
    sampleCount: 0,
  });
  const sparse = visualLossFromSamples([1], 4);
  assert.equal(sparse.confidence, 0.25);
  assert.equal(sparse.loss, 0.4);
  const sufficient = visualLossFromSamples([1, 1, 1, 1], 4);
  assert.equal(sufficient.confidence, 1);
  assert.equal(sufficient.loss, 0.1);
});

test('combines independently bounded loss components', () => {
  const result = calculateFidelityLoss({
    scopeCoverage: 0.5,
    clientCompleteness: 0.8,
    visualLoss: 0.2,
    reliabilityLoss: 0.1,
  });
  assert.ok(Math.abs(result.loss - 28) < 1e-12);
  assert.deepEqual(result.components, {
    scope: 0.5,
    completeness: 0.19999999999999996,
    visual: 0.2,
    reliability: 0.1,
  });
});
