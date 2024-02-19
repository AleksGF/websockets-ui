import { WebSocket } from 'ws';
import { addShipsToGame, verifyShipsData } from '../services/gameServices';
import { AddShipsData, CommandType, ShipData } from '../types/commandTypes';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const startGameHandler = async (
  index: number,
  ws: WebSocket,
  commandData: string,
) => {
  try {
    const wsConnections = getWsConnections();
    const shipsData = JSON.parse(commandData) as AddShipsData;

    await verifyShipsData(shipsData, index);

    const game = await addShipsToGame(shipsData);

    if (game.shipsData.some((data) => data === null)) return;

    const usersWSes = game.players.map((player) => {
      const userWs = wsConnections.getWsByIndex(player);

      if (!userWs) throw new Error('User connection not found');

      return userWs;
    });
    usersWSes.forEach((userWs, index) => {
      makeResponse(userWs, CommandType.START_GAME, {
        ships: game.shipsData[index] as ShipData[],
        currentPlayerIndex: index,
      });
      makeResponse(userWs, CommandType.TURN, {
        currentPlayer: game.turn,
      });
    });
  } catch (e) {
    const errorText =
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof e.message === 'string'
        ? e.message
        : 'Add ships error';
    makeResponse(ws, CommandType.ADD_SHIPS, { error: true, errorText });
  }
};
