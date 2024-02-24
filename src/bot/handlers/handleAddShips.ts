import { WebSocket } from 'ws';
import { CommandType } from '../../ws_server/types/commandTypes';
import { getShips } from '../services/addShipsServices';
import { BotData } from '../types/botTypes';

export const handleAddShips = async (wsClient: WebSocket, botData: BotData) => {
  const ships = await getShips();

  if (ships) {
    wsClient.send(
      JSON.stringify({
        type: CommandType.ADD_SHIPS,
        data: JSON.stringify({
          gameId: botData.idGame,
          ships,
          indexPlayer: botData.idPlayer,
        }),
        id: 0,
      }),
    );
  }
};
