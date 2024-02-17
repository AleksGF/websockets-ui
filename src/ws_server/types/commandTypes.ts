export type IncomingCommand =
  | {
      type: CommandType.REG;
      data: string;
      id: 0;
    }
  | {
      type: CommandType.CREATE_ROOM;
      data: '';
      id: 0;
    }
  | {
      type: CommandType.ADD_USER_TO_ROOM;
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

export type WinnerData = {
  name: string;
  wins: number;
};

export type ResponseData = UserAuthResponse;

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

type UserAuthResponse =
  | UserRegistrationData
  | UpdateRoomData
  | UpdateWinnersData
  | ErrorData;
