import { WebSocket } from 'ws';
import { createRoom } from '../services/roomServices';
import { makeResponse } from '../utils/makeResponse';
import { CommandType } from '../types/commandTypes';

export const createRoomHandler = async (index: number) => {
  try {
    const updateRoomsResult = await createRoom(index);
    makeResponse(index, CommandType.UPDATE_ROOM, updateRoomsResult);
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Create room error';
    makeResponse(index, CommandType.CREATE_ROOM, { error: true, errorText });
  }
};
