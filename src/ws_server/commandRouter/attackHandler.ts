import {
  getAroundKilledResults,
  getAttackResult,
  getRandomCoords,
  validateCoords,
  validateTurn,
} from '../services/attackServices';
import { getGameById } from '../services/gameServices';
import { isWinner } from '../services/winnerServices';
import {
  AttackData,
  CommandType,
  RandomAttackData,
} from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { handleWin } from './handleWin';

export const attackHandler = async (
  index: number,
  commandData: string,
  randomX?: number,
  randomY?: number,
): Promise<void> => {
  try {
    const commandObj = JSON.parse(commandData) as RandomAttackData | AttackData;

    const { gameId, indexPlayer } = commandObj;

    await validateTurn(gameId, indexPlayer);

    const x = randomX ?? (commandObj as AttackData).x;
    const y = randomY ?? (commandObj as AttackData).y;

    validateCoords(x, y);

    const attackResult = await getAttackResult(gameId, indexPlayer, x, y);

    const game = await getGameById(gameId);

    makeResponse(game.players, CommandType.ATTACK, attackResult);

    makeResponse(game.players, CommandType.TURN, {
      currentPlayer: game.turn,
    });

    if (attackResult.status === 'killed') {
      const aroundResults = await getAroundKilledResults(
        gameId,
        indexPlayer,
        x,
        y,
      );

      aroundResults.forEach((result) => {
        makeResponse(game.players, CommandType.ATTACK, result);
        makeResponse(game.players, CommandType.TURN, {
          currentPlayer: game.turn,
        });
      });
    }

    if (
      attackResult.status === 'killed' &&
      (await isWinner(gameId, indexPlayer))
    ) {
      await handleWin(index, gameId, indexPlayer, game.players);
    }
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Attack error';
    makeResponse(index, CommandType.ATTACK, {
      error: true,
      errorText,
    });
  }
};

export const randomCoordsHandler = async (
  index: number,
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
    makeResponse(index, CommandType.RANDOM_ATTACK, {
      error: true,
      errorText,
    });
  }
};
