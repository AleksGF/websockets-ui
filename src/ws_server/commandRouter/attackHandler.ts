import { WebSocket } from 'ws';
import {
  getAroundKilledResults,
  getAttackResult,
  getRandomCoords,
  validateCoords,
  validateTurn,
} from '../services/attackServices';
import { getGameById } from '../services/gameServices';
import { addWinner, getWinners, isWinner } from '../services/winnerServices';
import {
  AttackData,
  CommandType,
  RandomAttackData,
} from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';
import { handleWin } from './handleWin';

export const attackHandler = async (
  ws: WebSocket,
  commandData: string,
  randomX?: number,
  randomY?: number,
): Promise<void> => {
  try {
    const wsConnections = getWsConnections();
    const commandObj = JSON.parse(commandData) as RandomAttackData | AttackData;

    const { gameId, indexPlayer } = commandObj;

    await validateTurn(gameId, indexPlayer);

    const x = randomX ?? (commandObj as AttackData).x;
    const y = randomY ?? (commandObj as AttackData).y;

    validateCoords(x, y);

    const attackResult = await getAttackResult(gameId, indexPlayer, x, y);

    const game = await getGameById(gameId);
    const usersWSes = game.players.map((player) => {
      const userWs = wsConnections.getWsByIndex(player);

      if (!userWs) throw new Error('User connection not found');

      return userWs;
    });
    usersWSes.forEach((userWs, index) => {
      makeResponse(userWs, CommandType.ATTACK, attackResult);
      makeResponse(userWs, CommandType.TURN, {
        currentPlayer: game.turn,
      });
    });

    if (attackResult.status === 'killed') {
      const aroundResults = await getAroundKilledResults(
        gameId,
        indexPlayer,
        x,
        y,
      );

      aroundResults.forEach((result) => {
        usersWSes.forEach((userWs, index) => {
          makeResponse(userWs, CommandType.ATTACK, result);
          makeResponse(userWs, CommandType.TURN, {
            currentPlayer: game.turn,
          });
        });
      });
    }

    if (
      attackResult.status === 'killed' &&
      (await isWinner(gameId, indexPlayer))
    ) {
      await handleWin(ws, gameId, indexPlayer, usersWSes);
    }
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Attack error';
    makeResponse(ws, CommandType.ATTACK, {
      error: true,
      errorText,
    });
  }
};

export const randomCoordsHandler = async (
  ws: WebSocket,
  commandData: string,
): Promise<{ x: number; y: number } | undefined> => {
  try {
    const { gameId, indexPlayer } = JSON.parse(commandData) as RandomAttackData;
    const game = await getGameById(gameId);

    return await getRandomCoords(game, indexPlayer);
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Random attack error';
    makeResponse(ws, CommandType.RANDOM_ATTACK, {
      error: true,
      errorText,
    });
  }
};
