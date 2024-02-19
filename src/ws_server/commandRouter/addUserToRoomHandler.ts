import { WebSocket } from 'ws';
import { createGame } from '../services/gameServices';
import { addUserToRoom } from '../services/roomServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const addUserToRoomHandler = async (
  index: number,
  ws: WebSocket,
  commandData: string,
) => {
  try {
    const wsConnections = getWsConnections();
    const { indexRoom } = JSON.parse(commandData) as { indexRoom: number };

    const addUserToRoomResult = await addUserToRoom(index, indexRoom);
    makeResponse(ws, CommandType.UPDATE_ROOM, addUserToRoomResult);

    const createGameResult = await createGame(indexRoom);

    const usersWSes = createGameResult.players.map((player) => {
      const userWs = wsConnections.getWsByIndex(player);

      if (!userWs) throw new Error('User connection not found');

      return userWs;
    });
    usersWSes.forEach((userWs, index) => {
      makeResponse(userWs, CommandType.CREATE_GAME, {
        idGame: createGameResult.idGame,
        idPlayer: index,
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
    makeResponse(ws, CommandType.ADD_USER_TO_ROOM, {
      error: true,
      errorText,
    });
  }
};
