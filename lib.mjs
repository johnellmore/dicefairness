export class RollSet {
  constructor(rollCounts) {
    this.rollCounts = rollCounts;
  }

  get numRolls() {
    let sum = 0;
    this.rollCounts.forEach(numForRoll => sum += numForRoll);
    return sum;
  }

  get rollTypes() {
    return new Set(this.rollCounts.keys());
  }
}

export function parseDiceRolls(inputStr) {
  const lines = inputStr.split("\n");
  const sanitizedLines = lines
    .map(l => l.replace(/^\W+/g, '').replace(/\W+$/g, ''));
  const validLines = sanitizedLines.filter(l => !!l);
  return makeRollSetFromRolls(validLines);
}

export function makeRollSetFromRolls(rollsArr) {
  const counts = rollsArr
    .reduce((m, roll) =>
      m.set(roll, m.has(roll) ? m.get(roll) + 1 : 1),
      new Map()
    );
  return new RollSet(counts);
}

export function guessDiceType(rollSet) {
  const areRollsNumeric = [...rollSet.rollTypes].every(v => v.match(/^\d+$/));
  if (areRollsNumeric) {
    const numericRolls = [...rollSet.rollTypes].map(r => +r).sort((a, b) => a - b);
    const min = numericRolls[0];
    const max = numericRolls[numericRolls.length - 1];
    const range = max - min + 1;

    if (range <= 2 && max <= 2 && rollSet.numRolls >= 4) {
      return {type: 'd2', sides: 2 };
    }

    if (range <= 4 && max <= 4 && rollSet.numRolls >= 6) {
      return {type: 'd4', sides: 4 };
    }

    if (range <= 6 && max <= 6 && rollSet.numRolls >= 9) {
      return {type: 'd6', sides: 6 };
    }

    if (range <= 8 && max <= 8 && rollSet.numRolls >= 12) {
      return {type: 'd8', sides: 8 };
    }

    if (range <= 10 && max <= 10 && rollSet.numRolls >= 15) {
      return {type: 'd10', sides: 10 };
    }

    if (range <= 12 && max <= 12 && rollSet.numRolls >= 15) {
      return {type: 'd12', sides: 12 };
    }

    if (range <= 20 && max <= 20 && rollSet.numRolls >= 15) {
      return {type: 'd20', sides: 20 };
    }
  }

  const rollsToSides = rollSet.numRolls / rollSet.rollTypes.size;
  if (rollsToSides >= 4) {
    return {type: 'custom', sides: rollSet.rollTypes.size };
  }

  return null;
}

export function calcChiSquared(rollSet, sides) {
  // get an array of the different roll totals, where every side that WASN'T
  // rolled is given a 0
  const totals = [...rollSet.rollCounts.values(), ...Array(sides).fill(0)]
    .slice(0, sides);
  const nexp = rollSet.numRolls / sides;
  const chiSq = totals
    .reduce((chi, nk) => chi + (Math.pow(nk - nexp, 2) / nexp), 0);
  return chiSq;
}

export function chiSquaredCdfAt(chiSqVal, sides) {
  // hack: I'm lazy and importing the CommonJS module works in the Node.js test
  // script, but not in the browser. So I just added a script tag to the
  // index.html file, and I'm referencing it off the `window` object.
  return window.jStat.chisquare.cdf(chiSqVal, sides - 1);
}

export function suggestedMinimumDiceRolls(sides) {
  return 10 * sides;
}
