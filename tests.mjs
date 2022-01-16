import { calcChiSquared, chiSquaredCdfAt, guessDiceType, makeRollSetFromRolls, parseDiceRolls, RollSet } from './lib.mjs';

// Hack. We can't use ES modules to import jStat in the browser, so lib.mjs
// grabs it off the window object. So to make the tests work (in Node, where
// there's no window object), we'll just make a window object and provide the
// jStat property on it.
import jStat from './jstat.min.js';
globalThis.window = {
  jStat
};

test('parseDiceRolls() parses a set of clean d6 inputs', () => {
  const input = "5\n1\n4\n1\n4\n2\n1\n3\n5\n4\n";
  const expectedCounts = new Map([
    ['5', 2],
    ['1', 3],
    ['4', 3],
    ['2', 1],
    ['3', 1]
  ]);
  const actual = parseDiceRolls(input);
  assert(actual.rollCounts.size === expectedCounts.size);
  actual.rollCounts.forEach(
    (numRolls, roll) => assert(expectedCounts.get(roll) === numRolls)
  );
});

test('parseDiceRolls() parses a messy set of coin flips', () => {
  const input = "heads\nheads\nheads \n tails \ntails\n heads\ntails\n\nheads\nheads\ntails\n\n";
  const expectedCounts = new Map([
    ['heads', 6],
    ['tails', 4],
  ]);
  const actual = parseDiceRolls(input);
  assert(actual.rollCounts.size === expectedCounts.size);
  actual.rollCounts.forEach(
    (numRolls, roll) => assert(expectedCounts.get(roll) === numRolls)
  );
});

test('RollSet reports num rolls and types of rolls correctly', () => {
  const rollCounts = new Map([
    ['5', 2],
    ['1', 3],
    ['4', 3],
    ['2', 1],
    ['3', 1]
  ]);
  const rollSet = new RollSet(rollCounts);

  assert(rollSet.numRolls === 10);

  const expectedRollTypes = new Set(['1', '2', '3', '4', '5']);
  assert(expectedRollTypes.size === rollSet.rollTypes.size);
  for (var expectedType of expectedRollTypes) {
    assert(rollSet.rollTypes.has(expectedType));
  }
});

test('guessDiceType() is indeterminate when appropriate', () => {
  const noRollsGuess = guessDiceType(makeRollSetFromRolls([]));
  assert(noRollsGuess === null);

  const justOneRollGuess = guessDiceType(makeRollSetFromRolls(['1']));
  assert(justOneRollGuess === null);

  const smallSetGuess = guessDiceType(makeRollSetFromRolls(['1', '5', '6']));
  assert(smallSetGuess === null);
});

test('guessDiceType() identifies coin flips', () => {
  const rolls1 = shuffle([...Array(6).fill('heads'), ...Array(4).fill('tails')]);
  const guess1 = guessDiceType(makeRollSetFromRolls(rolls1));
  assert(guess1 !== null);
  assert(guess1.type === 'custom');
  assert(guess1.sides === 2);

  const rolls2 = shuffle([...Array(7).fill('h'), ...Array(3).fill('t')]);
  const guess2 = guessDiceType(makeRollSetFromRolls(rolls2));
  assert(guess2 !== null);
  assert(guess2.type === 'custom');
  assert(guess2.sides === 2);
});

test('guessDiceType() identifies standard dice types', () => {
  const d4 = ['2', '2', '4', '3', '4', '2', '1', '2'];
  const d4Guess = guessDiceType(makeRollSetFromRolls(d4));
  assert(d4Guess !== null);
  assert(d4Guess.type === 'd4');
  assert(d4Guess.sides === 4);

  const d6 = ['4', '2', '3', '4', '3', '6', '6', '3', '1', '5'];
  const d6Guess = guessDiceType(makeRollSetFromRolls(d6));
  assert(d6Guess !== null);
  assert(d6Guess.type === 'd6');
  assert(d6Guess.sides === 6);

  // These random rolls in partiular are interesting because they don't have any
  // lower values. The guesser should still notice that they are numeric, and
  // that they range up to 8 though.
  const d8 = ['6', '8', '6', '3', '8', '8', '6', '7', '6', '8', '4', '6'];
  const d8Guess = guessDiceType(makeRollSetFromRolls(d8));
  assert(d8Guess !== null);
  assert(d8Guess.type === 'd8');
  assert(d8Guess.sides === 8);

  const d10 = ['5', '4', '5', '9', '8', '8', '0', '9', '5', '7', '8', '6', '3', '8', '9'];
  const d10Guess = guessDiceType(makeRollSetFromRolls(d10));
  assert(d10Guess !== null);
  assert(d10Guess.type === 'd10');
  assert(d10Guess.sides === 10);

  const d12 = ['10', '10', '4', '4', '10', '12', '1', '10', '1', '9', '10', '11', '5', '11', '11', '9', '12', '12'];
  const d12Guess = guessDiceType(makeRollSetFromRolls(d12));
  assert(d12Guess !== null);
  assert(d12Guess.type === 'd12');
  assert(d12Guess.sides === 12);

  const d20 = ['9', '14', '12', '8', '4', '11', '7', '6', '15', '15', '14', '14', '17', '19', '1', '4', '19', '5', '6', '18', '11', '6', '17', '5', '9', '12', '20', '1', '6', '2'];
  const d20Guess = guessDiceType(makeRollSetFromRolls(d20));
  assert(d20Guess !== null);
  assert(d20Guess.type === 'd20');
  assert(d20Guess.sides === 20);
});

test('guessDiceType() identifies any collection of side types', () => {
  const rolls = ['b', 'b', 'd', 'c', 'd', 'b', 'a', 'b', 'b', 'b', 'd', 'c', 'd', 'b', 'a', 'b'];
  const guess = guessDiceType(makeRollSetFromRolls(rolls));
  assert(guess !== null);
  assert(guess.type === 'custom');
  assert(guess.sides === 4);
});

test('calcChiSquared() reports zero for a uniformly-distributed set of dice rolls', () => {
  // build a set of 100 d20 rolls, where each side was rolled exactly 5 times
  const rolls = new RollSet(new Map(Array(20).fill(0).map((_, i) => ['' + (i + 1), 5])));
  assert(calcChiSquared(rolls, 20) === 0);
});

test('chiSquaredCdfAt() returns a correct response for a known chi-squared value', () => {
  const confidence = chiSquaredCdfAt(27.204, 20);
  assert(Math.abs(confidence - 0.90) < 0.001);
})

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function assert(cond) {
  if (!cond) {
    throw new Error('Assertion failed');
  }
}

function test(desc, func) {
  try {
    func();
  } catch (e) {
    console.error(`❌ ${desc}`);
    console.error(e);
    return;
  }
  console.log(`✔️ ${desc}`);
}
