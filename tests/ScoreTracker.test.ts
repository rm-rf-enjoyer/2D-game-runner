import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ScoreTracker } from '../src/scenes/game/ScoreTracker.ts';

function createLabel() {
  return {
    text: '',
    setText(value: string) {
      this.text = value;
    },
  };
}

test('score tracker accumulates distance from speed and delta', () => {
  const label = createLabel();
  const score = new ScoreTracker(label);

  score.update(100, 1000);
  assert.equal(score.text, '10 m');

  score.update(100, 500);
  assert.equal(score.text, '15 m');
});

test('score tracker re-renders the frozen value', () => {
  const label = createLabel();
  const score = new ScoreTracker(label);

  score.update(123, 1000);
  label.setText('cleared');
  score.render();

  assert.equal(score.text, '12 m');
});
