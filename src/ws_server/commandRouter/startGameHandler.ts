import { WebSocket } from 'ws';
import { addShipsToGame, verifyShipsData } from '../services/gameServices';
import { AddShipsData, CommandType, ShipData } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';

export const startGameHandler = async (
  index: number,
  ws: WebSocket,
  commandData: string,
) => {
  try {
    const shipsData = JSON.parse(commandData) as AddShipsData;

    await verifyShipsData(shipsData, index);

    const game = await addShipsToGame(shipsData);

    if (game.shipsData.some((data) => data === null)) return;

    game.players.forEach((player, playerId) => {
      makeResponse(player, CommandType.START_GAME, {
        ships: game.shipsData[playerId] as ShipData[],
        currentPlayerIndex: playerId,
      });
    });

    makeResponse(game.players, CommandType.TURN, {
      currentPlayer: game.turn,
    });
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Add ships error';
    makeResponse(index, CommandType.ADD_SHIPS, { error: true, errorText });
  }
};
