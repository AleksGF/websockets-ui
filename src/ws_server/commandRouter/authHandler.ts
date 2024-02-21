import { WebSocket } from 'ws';
import { getAvailableRooms } from '../services/roomServices';
import { userAuth } from '../services/userAuth';
import { getWinners } from '../services/winnerServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const authHandler = async (ws: WebSocket, commandData: string) => {
  const wsConnections = getWsConnections();

  try {
    const userAuthResultData = await userAuth(JSON.parse(commandData));
    const { index } = userAuthResultData;

    wsConnections.setNewConnection(ws, index);

    makeResponse(index, CommandType.REG, userAuthResultData);

    const updateRoomsResult = await getAvailableRooms();

    makeResponse(index, CommandType.UPDATE_ROOM, updateRoomsResult);

    const updateWinnersResult = await getWinners();

    makeResponse(index, CommandType.UPDATE_WINNERS, updateWinnersResult);
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'User auth error';

    makeResponse(ws, CommandType.REG, { error: true, errorText });
  }
};
