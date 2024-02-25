export enum CellState {
  EMPTY = 0,
  MISS = 1,
  HIT = 2,
  KILLED = 3,
}

export type BotData = {
  botId: number | null;
  idGame: number | null;
  idPlayer: number | null;
  fieldMap: CellState[];
  nextTurnTimerId: NodeJS.Timeout | null;
};

export type BotShipData = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
};
