import process from 'process';
import WSClient, { RawData } from 'ws';
import { CommandType } from '../ws_server/types/commandTypes';
import { handleAddMove } from './handlers/handleAddMove';
import { handleAddShips } from './handlers/handleAddShips';
import { handleNextTurn } from './handlers/handleNextTurn';
import { handleRegistration } from './handlers/handleRegistration';
import { BotData, CellState } from './types/botTypes';

if (!process.send) throw new Error('Bot can be run only in a forked process');

const send = process.send.bind(process);
const nextTurnTimeout = 3000; //ms

const startBot = async () => {
  const wsClient = new WSClient('ws://localhost:3000');
  const botData: BotData = {
    botId: null,
    idGame: null,
    idPlayer: null,
    fieldMap: new Array(100).fill(CellState.EMPTY),
    nextTurnTimerId: null,
  };

  const messageListener = async (message: RawData) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const data = JSON.parse(parsedMessage.data);

      if (
        parsedMessage.type === CommandType.REG &&
        'index' in data &&
        typeof data.index === 'number'
      ) {
        botData.botId = data.index;
        send({ type: 'bot_registration', data: { index: botData.botId } });
      }

      if (
        parsedMessage.type === CommandType.CREATE_GAME &&
        'idGame' in data &&
        typeof data.idGame === 'number' &&
        'idPlayer' in data &&
        typeof data.idPlayer === 'number'
      ) {
        botData.idGame = data.idGame;
        botData.idPlayer = data.idPlayer;
        await handleAddShips(wsClient, botData);
      }

      if (
        parsedMessage.type === CommandType.ATTACK &&
        'position' in data &&
        data.position &&
        typeof data.position === 'object' &&
        'x' in data.position &&
        typeof data.position.x === 'number' &&
        'y' in data.position &&
        typeof data.position.y === 'number' &&
        'currentPlayer' in data &&
        data.currentPlayer === botData.idPlayer &&
        'status' in data &&
        (data.status === 'shot' ||
          data.status === 'miss' ||
          data.status === 'killed')
      ) {
        handleAddMove(botData, data.position.x, data.position.y, data.status);
      }

      if (
        parsedMessage.type === CommandType.TURN &&
        'currentPlayer' in data &&
        data.currentPlayer === botData.idPlayer
      ) {
        if (botData.nextTurnTimerId) clearTimeout(botData.nextTurnTimerId);

        botData.nextTurnTimerId = setTimeout(async () => {
          botData.nextTurnTimerId = null;
          await handleNextTurn(wsClient, botData);
        }, nextTurnTimeout);
      }

      if (parsedMessage.type === CommandType.FINISH) {
        if (botData.nextTurnTimerId) clearTimeout(botData.nextTurnTimerId);
        wsClient.close();
      }
    } catch (e) {
      console.log(e);
    }
  };

  return new Promise<number>((resolve) => {
    wsClient.on('open', async () => {
      wsClient.on('message', messageListener);

      wsClient.on('close', () => {
        resolve(0);
      });

      handleRegistration(wsClient);
    });
  });
};

startBot().then((code) => {
  process.exit(code ?? 1);
});
