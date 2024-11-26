export enum Arrow {
  LEFT = 'L',
  DOWN = 'D',
  UP = 'U',
  RIGHT = 'R'
}

type Patterns = {
  staircases: Arrow[][],
  drills: Arrow[][],
  triangleCandleEnds: Arrow[][]
}

const rotateArray = (arr: Arrow[]) => {
  return arr.slice(1).concat(arr[0]);
}

const duplicateAndRotatePatterns = (patterns: Patterns) => {
  const newPatterns = { ...patterns };
  newPatterns.staircases = patterns.staircases.flatMap(pattern => {
    const rotations = [pattern];
    let rotatedPattern = pattern;
    for (let i = 0; i < 3; i++) {
      rotatedPattern = rotateArray(rotatedPattern);
      rotations.push(rotatedPattern);
    }
    return rotations;
  });
  newPatterns.drills = patterns.drills.flatMap(pattern => {
    const rotations = [pattern];
    let rotatedPattern = pattern;
    for (let i = 0; i < 1; i++) {
      rotatedPattern = rotateArray(rotatedPattern);
      rotations.push(rotatedPattern);
    }
    return rotations;
  });
  newPatterns.triangleCandleEnds = patterns.triangleCandleEnds.flatMap(pattern => {
    const rotations = [pattern];
    let rotatedPattern = pattern;
    for (let i = 0; i < 7; i++) {
      rotatedPattern = rotateArray(rotatedPattern);
      rotations.push(rotatedPattern);
    }
    return rotations;
  });

  return newPatterns;
}

// skip translations, we'll randomly add that
const patterns: Patterns = {
  // skip translations, we'll randomly add that
  staircases: [
    [Arrow.LEFT, Arrow.UP, Arrow.DOWN, Arrow.RIGHT],
    [Arrow.LEFT, Arrow.DOWN, Arrow.UP, Arrow.RIGHT],
    [Arrow.RIGHT, Arrow.UP, Arrow.DOWN, Arrow.LEFT],
    [Arrow.RIGHT, Arrow.DOWN, Arrow.UP, Arrow.LEFT],
  ],
  drills: [
    [Arrow.LEFT, Arrow.UP, Arrow.LEFT, Arrow.UP],
    [Arrow.LEFT, Arrow.DOWN, Arrow.LEFT, Arrow.DOWN],
    [Arrow.RIGHT, Arrow.UP, Arrow.RIGHT, Arrow.UP],
    [Arrow.RIGHT, Arrow.DOWN, Arrow.RIGHT, Arrow.DOWN],
    [Arrow.UP, Arrow.DOWN, Arrow.UP, Arrow.DOWN],
    [Arrow.LEFT, Arrow.RIGHT, Arrow.LEFT, Arrow.RIGHT]
  ],
  triangleCandleEnds: [
    [Arrow.LEFT, Arrow.UP, Arrow.LEFT, Arrow.RIGHT, Arrow.DOWN, Arrow.RIGHT, Arrow.UP, Arrow.DOWN],
    [Arrow.RIGHT, Arrow.UP, Arrow.RIGHT, Arrow.LEFT, Arrow.DOWN, Arrow.LEFT, Arrow.UP, Arrow.DOWN],
    [Arrow.LEFT, Arrow.DOWN, Arrow.LEFT, Arrow.RIGHT, Arrow.UP, Arrow.RIGHT, Arrow.DOWN, Arrow.UP],
    [Arrow.RIGHT, Arrow.DOWN, Arrow.RIGHT, Arrow.LEFT, Arrow.UP, Arrow.LEFT, Arrow.DOWN, Arrow.UP],
  ]
};

const newPatterns = duplicateAndRotatePatterns(patterns);
const allPatterns = Object.values(newPatterns).flat(1);

const getRandomElement = (arr: any[]) => {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

export const genChart = (noJacks: boolean = true) => {
  const chart = [];
  const PATTERN_LIMIT = 1024; // 4092+ beats worth, should be enough

  for (let i = 0; i < PATTERN_LIMIT; i++) {
    chart.push(getRandomElement(allPatterns))
  }

  const flat = chart.flat();

  if (noJacks) {
    return flat.filter((letter, index) => {
      return index === 0 || letter !== flat[index - 1];
    });
  }

  return flat;
};
