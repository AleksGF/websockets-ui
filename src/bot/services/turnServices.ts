import { BotData, CellState } from '../types/botTypes';

const getRandomCoord = (fieldMap: CellState[]) => {
  const possibleTurns = fieldMap
    .map((_, index) => index)
    .filter((ind) => fieldMap[ind] === CellState.EMPTY);

  return possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
};

const getNextFromShotCoord = (fieldMap: CellState[], shotShipCoord: number) => {
  const possibleTurns: number[] = [];

  const x = shotShipCoord % 10;
  const y = Math.floor(shotShipCoord / 10);

  if (
    (x - 1 >= 0 && fieldMap[x - 1 + y * 10] === CellState.HIT) ||
    (x + 1 < 10 && fieldMap[x + 1 + y * 10] === CellState.HIT)
  ) {
    [-1, 1].forEach((i) => {
      let offset = 0;

      while (
        x + offset >= 0 &&
        x + offset < 10 &&
        fieldMap[x + offset + y * 10] === CellState.HIT
      ) {
        offset += i;
      }

      if (
        x + offset >= 0 &&
        x + offset < 10 &&
        fieldMap[x + offset + y * 10] === CellState.EMPTY
      ) {
        possibleTurns.push(x + offset + y * 10);
      }
    });
  }

  if (
    (y - 1 >= 0 && fieldMap[x + (y - 1) * 10] === CellState.HIT) ||
    (y + 1 < 10 && fieldMap[x + (y + 1) * 10] === CellState.HIT)
  ) {
    [-1, 1].forEach((i) => {
      let offset = 0;

      while (
        y + offset >= 0 &&
        y + offset < 10 &&
        fieldMap[x + (y + offset) * 10] === CellState.HIT
      ) {
        offset += i;
      }

      if (
        y + offset >= 0 &&
        y + offset < 10 &&
        fieldMap[x + (y + offset) * 10] === CellState.EMPTY
      ) {
        possibleTurns.push(x + (y + offset) * 10);
      }
    });
  }

  if (possibleTurns.length === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue;
        if (i !== 0 && j !== 0) continue;
        if (x + i < 0 || x + i > 9 || y + j < 0 || y + j > 9) continue;

        if (fieldMap[x + i + (y + j) * 10] === CellState.EMPTY) {
          possibleTurns.push(x + i + (y + j) * 10);
        }
      }
    }
  }

  return possibleTurns.length
    ? possibleTurns[Math.floor(Math.random() * possibleTurns.length)]
    : getRandomCoord(fieldMap);
};

export const getNextTurn = (botData: BotData) => {
  const { fieldMap } = botData;

  const shotShipCoord = fieldMap.findIndex((cell) => cell === CellState.HIT);

  const nextTurn =
    shotShipCoord === -1
      ? getRandomCoord(fieldMap)
      : getNextFromShotCoord(fieldMap, shotShipCoord);

  return { x: nextTurn % 10, y: Math.floor(nextTurn / 10) };
};
