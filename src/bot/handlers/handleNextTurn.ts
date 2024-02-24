import { WebSocket } from 'ws';
import { CommandType } from '../../ws_server/types/commandTypes';
import { getNextTurn } from '../services/turnServices';
import { BotData } from '../types/botTypes';

const chanceForRandomAttack = 0.1;

export const handleNextTurn = async (wsClient: WebSocket, botData: BotData) => {
  const { x, y } = getNextTurn(botData);

  if (Math.random() < 1 - chanceForRandomAttack) {
    wsClient.send(
      JSON.stringify({
        type: CommandType.ATTACK,
        data: JSON.stringify({
          gameId: botData.idGame,
          indexPlayer: botData.idPlayer,
          x,
          y,
        }),
        id: 0,
      }),
    );
  } else {
    wsClient.send(
      JSON.stringify({
        type: CommandType.RANDOM_ATTACK,
        data: JSON.stringify({
          gameId: botData.idGame,
          indexPlayer: botData.idPlayer,
        }),
        id: 0,
      }),
    );
  }
};
