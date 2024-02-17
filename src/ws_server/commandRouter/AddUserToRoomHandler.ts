import { WebSocket } from 'ws';
import { addUserToRoom } from '../services/roomServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';

export const addUserToRoomHandler = async (
  index: number,
  ws: WebSocket,
  commandData: string,
) => {
  try {
    const { indexRoom } = JSON.parse(commandData) as { indexRoom: number };

    const addUserToRoomResult = await addUserToRoom(index, indexRoom);
    makeResponse(ws, CommandType.UPDATE_ROOM, addUserToRoomResult);

    //TODO : Create game....
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
