export class SnakeCore {
  #size;
  #map;
  #headPosition;
  #tailPosition;
  #headDirection;
  #foodPosition;
  #pastMoves;
  #lastMovedDirection;
  #gameOver;
  #snakeLength;
  #totalCells;
  #gameWon;
  #score;
  #foodScoreValue;
  #timeScoreValue;
  #scoreIntervalTimeValue;
  #scoreInterval;

  constructor(
    size,
    startingLength,
    foodScore = 100,
    timeInterval = 1000,
    timeScore = 10
  ) {
    if (startingLength > size / 2) {
      throw new Error('Invalid starting length');
    }
    this.#size = size;
    this.#totalCells = size ** 2;
    this.#gameOver = false;
    this.#gameWon = false;
    this.#snakeLength = startingLength;
    this.#score = 0;
    this.#foodScoreValue = foodScore;
    this.#timeScoreValue = timeScore;
    this.#scoreIntervalTimeValue = timeInterval;
    this.#map = Array.from({ length: this.#size }, () =>
      Array.from({ length: this.#size }, () => 0)
    );
    this.#headPosition = [
      Math.floor(this.#size / 2),
      Math.floor(this.#size / 2),
    ];
    this.#setCellAt(this.#headPosition, 'head');
    this.#tailPosition = [
      this.#headPosition[0],
      this.#headPosition[1] - startingLength + 1,
    ];
    this.#setCellAt(this.#tailPosition, 'tail');
    this.#headDirection = 'right';
    this.#lastMovedDirection = 'right';
    this.#pastMoves = Array.from({ length: this.#size }, () =>
      Array.from({ length: this.#size }, () => null)
    );
    this.#setPastMoveAt(this.#tailPosition, 'right');
    for (let i = 1; i < startingLength - 1; i++) {
      this.#setCellAt(
        [this.#tailPosition[0], this.#tailPosition[1] + i],
        'body'
      );
      this.#setPastMoveAt(
        [this.#tailPosition[0], this.#tailPosition[1] + i],
        'right'
      );
    }
  }

  #getStatusValue(string) {
    return this.cellStatuses.get(string);
  }

  // #getStatusString(value) {
  //   return [...this.cellStatuses.entries()].find(
  //     ([key, val]) => val === value
  //   )[0];
  // }

  #getDirectionValue(string) {
    return this.directions.get(string);
  }

  // #getDirectionString(value) {
  //   return [...this.directions.entries()].find(
  //     ([key, val]) => val === value
  //   )[0];
  // }

  #getCellIndexesAtDirection([i, j], direction) {
    const [shiftRow, shiftColumn] = this.#getDirectionValue(direction);
    return [(i + shiftRow) % this.#size][(j + shiftColumn) % this.#size];
  }

  #getCellAt([i, j]) {
    return this.#map[i][j];
  }

  #setCellAt(position, value) {
    this.#map[position[0]][position[1]] = this.#getStatusValue(value);
  }

  #getPastMoveAt(position) {
    return position.reduce((arr, index) => arr[index], this.#pastMoves);
  }

  #setPastMoveAt(position, value) {
    this.#pastMoves[position[0]][position[1]] = value;
  }

  #shiftIndex(startingIndex, movement) {
    return startingIndex + movement;
  }

  #setGameOver() {
    this.stop();
    this.#gameOver = true;
  }

  #setGameWon() {
    this.stop();
    this.#gameWon = true;
  }

  spawnFood() {
    if (this.#gameOver || this.#gameWon) return;
    while (true) {
      const i = Math.floor(Math.random() * this.#size);
      const j = Math.floor(Math.random() * this.#size);
      if (this.#setFood(i, j)) {
        this.#foodPosition = [i, j];
        return [i, j];
      }
    }
  }

  start() {
    if (this.#timeScoreValue > 0) {
      this.#scoreInterval = setInterval(
        (() => {
          this.#score += this.#timeScoreValue;
        }).bind(this),
        this.#scoreIntervalTimeValue
      );
    }
  }

  move() {
    if (this.#gameOver) return [];
    let changes = [];
    let foodEaten = false;
    this.#headDirection;

    this.#setPastMoveAt(this.#headPosition, this.#headDirection);

    const [shiftRowHead, shiftColumnHead] = this.#getDirectionValue(
      this.#headDirection
    );

    this.#setCellAt(this.#headPosition, 'body');
    changes.push({
      position: this.#headPosition,
      status: 'body',
      direction: [this.#lastMovedDirection, this.#headDirection],
    });

    const [nextRow, nextColumn] = [
      this.#shiftIndex(this.#headPosition[0], shiftRowHead),
      this.#shiftIndex(this.#headPosition[1], shiftColumnHead),
    ];

    if (
      nextRow >= this.#size ||
      nextColumn >= this.#size ||
      nextRow < 0 ||
      nextColumn < 0 ||
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('body') ||
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('tail')
    ) {
      this.#setGameOver();
      return [];
    } else if (
      this.#getCellAt([nextRow, nextColumn]) === this.#getStatusValue('food')
    ) {
      foodEaten = true;
    }

    this.#headPosition = [nextRow, nextColumn];

    this.#setCellAt(this.#headPosition, 'head');
    changes.push({
      position: this.#headPosition,
      status: 'head',
      direction: [this.#headDirection],
    });

    if (foodEaten) {
      this.#foodPosition = null;
      this.#lastMovedDirection = this.#headDirection;
      this.#snakeLength++;
      this.#score += this.#foodScoreValue;
      if (this.#snakeLength === this.#totalCells) this.#setGameWon();
      changes.push({
        position: this.spawnFood(),
        status: 'food',
        direction: [],
      });
      return changes;
    }

    const [shiftRowTail, shiftColumnTail] = this.#getDirectionValue(
      this.#getPastMoveAt(this.#tailPosition)
    );

    this.#setPastMoveAt(this.#tailPosition, null);
    this.#setCellAt(this.#tailPosition, 'empty');
    changes.push({
      position: this.#tailPosition,
      status: 'empty',
      direction: [],
    });

    this.#tailPosition = [
      this.#shiftIndex(this.#tailPosition[0], shiftRowTail),
      this.#shiftIndex(this.#tailPosition[1], shiftColumnTail),
    ];
    this.#setCellAt(this.#tailPosition, 'tail');
    changes.push({
      position: this.#tailPosition,
      status: 'tail',
      direction: [this.#getPastMoveAt(this.#tailPosition)],
    });
    this.#lastMovedDirection = this.#headDirection;
    return changes;
  }

  // get map() {
  //   return this.#map.map(row => row.map(cell => this.#getStatusString(cell)));
  // }
  // get pastMoves() {
  //   return this.#pastMoves.map(row =>
  //     row.map(cell => this.#getDirectionString(cell))
  //   );
  // }

  get headPosition() {
    return this.#headPosition;
  }

  get score() {
    return this.#score;
  }

  get snakeLength() {
    return this.#snakeLength;
  }

  isGameOver() {
    return this.#gameOver;
  }

  isGameWon() {
    return this.#gameWon;
  }

  isNearFood() {
    const [headI, headJ] = this.#headPosition;
    const [foodI, foodJ] = this.#foodPosition;
    return Math.abs(headI - foodI) + Math.abs(headJ - foodJ) === 3;
  }

  #setFood(i, j) {
    if (this.#getCellAt([i, j]) !== this.#getStatusValue('empty')) {
      return false;
    }
    this.#setCellAt([i, j], 'food');
    return true;
  }

  setDirection(direction) {
    const verticalDirections = ['up', 'down'];
    const horizontalDirections = ['left', 'right'];
    if (
      (verticalDirections.includes(this.#lastMovedDirection) &&
        verticalDirections.includes(direction)) ||
      (horizontalDirections.includes(this.#lastMovedDirection) &&
        horizontalDirections.includes(direction))
    ) {
      return;
    }
    this.#headDirection = direction;
  }

  stop() {
    clearInterval(this.#scoreInterval);
  }
}

SnakeCore.prototype.directions = new Map([
  ['none', null],
  ['up', [-1, 0]],
  ['down', [1, 0]],
  ['left', [0, -1]],
  ['right', [0, 1]],
]);

SnakeCore.prototype.cellStatuses = new Map([
  ['empty', 0],
  ['head', 1],
  ['body', 2],
  ['tail', 3],
  ['food', 4],
]);
