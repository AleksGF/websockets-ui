export type Command = {
  type: CommandType;
  data: string;
  id: 0;
};

export enum CommandType {
  REG = 'reg',
  UPDATE_ROOM = 'update_room',
  UPDATE_WINNERS = 'update_winners',
  CREATE_ROOM = 'create_room',
  ADD_USER_TO_ROOM = 'add_user_to_room',
  CREATE_GAME = 'create_game',
  ADD_SHIPS = 'add_ships',
  START_GAME = 'start_game',
  TURN = 'turn',
  RANDOM_ATTACK = 'randomAttack',
  ATTACK = 'attack',
  FINISH = 'finish',
}

export type UserData = {
  name: string;
  password: string;
};

export type RoomData = {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  }[];
};

export type RandomAttackData = {
  gameId: number;
  indexPlayer: number;
};

export type AttackData = RandomAttackData & {
  x: number;
  y: number;
};

export type GameData = {
  idGame: number;
  players: number[];
  turn: number;
  shipsData: (ShipData[] | null)[];
  ships: Record<number, number[][]>;
  moves: Record<number, Set<number>>;
};

export type WinnerData = {
  name: string;
  wins: number;
};

export type ResponseData =
  | UserRegistrationData
  | UpdateRoomData
  | UpdateWinnersData
  | CreateGameData
  | StartGameData
  | TurnData
  | AttackResultData
  | FinishData
  | ErrorData;

type ErrorData = { error: true; errorText: string };

export type UserRegistrationData = {
  name: string;
  index: number;
  error: false;
};

export type UpdateRoomData = {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  }[];
}[];

export type UpdateWinnersData = {
  name: string;
  wins: number;
}[];

export type CreateGameData = {
  idGame: number;
  idPlayer: number;
};

export type ShipData = {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
};

type StartGameData = {
  ships: ShipData[];
  currentPlayerIndex: number;
};

export type AddShipsData = {
  gameId: number;
  ships: ShipData[];
  indexPlayer: number;
};

type TurnData = {
  currentPlayer: number;
};

export type AttackResultData = {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
};

type FinishData = {
  winPlayer: number;
};
