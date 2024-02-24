import { BotData, CellState } from '../types/botTypes';

export const handleAddMove = (
  botData: BotData,
  x: number,
  y: number,
  status: 'miss' | 'killed' | 'shot',
) => {
  const markNeighborsKilled = (x: number, y: number, fieldMap: CellState[]) => {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 || j === 0) {
          const coord = (y + j) * 10 + (x + i);

          if (fieldMap[coord] === CellState.HIT) {
            fieldMap[coord] = CellState.KILLED;
            markNeighborsKilled(x + i, y + j, fieldMap);
          }
        }
      }
    }

    [-1, 1].forEach((i) => {
      [-1, 1].forEach((j) => {
        const coord = (y + j) * 10 + (x + i);

        if (fieldMap[coord] === CellState.HIT) {
          fieldMap[coord] = CellState.KILLED;
          markNeighborsKilled(x + i, y + j, fieldMap);
        }
      });
    });
  };

  const { fieldMap } = botData;
  const coord = y * 10 + x;

  if (status === 'miss') {
    fieldMap[coord] = CellState.MISS;
  }

  if (status === 'shot') {
    fieldMap[coord] = CellState.HIT;
  }

  if (status === 'killed') {
    fieldMap[coord] = CellState.KILLED;
    markNeighborsKilled(x, y, fieldMap);
  }
};
