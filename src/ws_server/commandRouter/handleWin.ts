import { WebSocket } from 'ws';
import { removeGame } from '../services/gameServices';
import { removeRoom } from '../services/roomServices';
import { addWinner, getWinners } from '../services/winnerServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';

export const handleWin = async (
  index: number,
  gameId: number,
  indexPlayer: number,
  users: number[],
): Promise<void> => {
  await addWinner(index);

  makeResponse(users, CommandType.FINISH, {
    winPlayer: indexPlayer,
  });

  const updateWinnersResult = await getWinners();
  makeResponse(index, CommandType.UPDATE_WINNERS, updateWinnersResult);

  await removeRoom(index);

  await removeGame(gameId);
};
