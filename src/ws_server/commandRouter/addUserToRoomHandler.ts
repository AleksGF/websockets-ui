import { createGame } from '../services/gameServices';
import { addUserToRoom } from '../services/roomServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';

export const addUserToRoomHandler = async (
  index: number,
  commandData: string,
) => {
  try {
    const { indexRoom } = JSON.parse(commandData) as { indexRoom: number };

    const addUserToRoomResult = await addUserToRoom(index, indexRoom);
    makeResponse(index, CommandType.UPDATE_ROOM, addUserToRoomResult);

    const createGameResult = await createGame(indexRoom);

    createGameResult.players.forEach((player, idPlayer) => {
      makeResponse(player, CommandType.CREATE_GAME, {
        idGame: createGameResult.idGame,
        idPlayer,
      });
    });
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Add user to room error';
    makeResponse(index, CommandType.ADD_USER_TO_ROOM, {
      error: true,
      errorText,
    });
  }
};
