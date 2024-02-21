import { WebSocket } from 'ws';
import { removeGame } from '../services/gameServices';
import { removeRoom } from '../services/roomServices';
import { addWinner, getWinners } from '../services/winnerServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const handleWin = async (
  ws: WebSocket,
  gameId: number,
  indexPlayer: number,
  usersWSes: WebSocket[],
): Promise<void> => {
  const wsConnections = getWsConnections();
  const index = wsConnections.getUserIndex(ws) as number;

  await addWinner(index);

  usersWSes.forEach((userWs) => {
    makeResponse(userWs, CommandType.FINISH, {
      winPlayer: indexPlayer,
    });
  });

  const updateWinnersResult = await getWinners();
  makeResponse(ws, CommandType.UPDATE_WINNERS, updateWinnersResult);

  await removeRoom(index);

  await removeGame(gameId);
};
