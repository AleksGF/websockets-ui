import path from 'path';
import childProcess from 'child_process';
import { createGame } from '../services/gameServices';
import { addUserToRoom, createRoom } from '../services/roomServices';
import { CommandType } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';

export const handleSinglePlay = async (playerIndex: number) => {
  const botRegistrationTimeout = 30000; //ms

  try {
    const botPath = path.resolve(__dirname, '../../bot/index.ts');

    const bot = childProcess.fork(botPath, [], {
      execArgv: ['-r', 'ts-node/register'],
    });

    const botIndex = await new Promise<number>((resolve, reject) => {
      const rejectTimer = setTimeout(() => {
        bot.kill();
        reject(new Error('Exceeded bot registration timeout'));
      }, botRegistrationTimeout);

      bot.on('message', (message) => {
        if (
          message &&
          typeof message === 'object' &&
          'type' in message &&
          message.type === 'bot_registration' &&
          'data' in message &&
          typeof message.data === 'object' &&
          message.data &&
          'index' in message.data &&
          typeof message.data.index === 'number'
        ) {
          clearTimeout(rejectTimer);
          resolve(message.data.index);
        }
      });
    });

    const rooms = await createRoom(playerIndex);
    const roomId = (
      rooms.find((room) =>
        Object.values(room.roomUsers)
          .map((user) => user.index)
          .includes(playerIndex),
      ) as { roomId: number }
    ).roomId;

    await addUserToRoom(botIndex, roomId);

    const createGameResult = await createGame(roomId);

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
        : 'Error while starting single play';
    makeResponse(playerIndex, CommandType.SINGLE_PLAY, {
      error: true,
      errorText,
    });
  }
};
