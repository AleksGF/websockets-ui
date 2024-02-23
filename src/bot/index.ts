import process from 'process';
import WSClient from 'ws';
import { CommandType } from '../ws_server/types/commandTypes';
import { handleRegistration } from './handlers/handleRegistration';

if (!process.send) throw new Error('Bot can be run only in a forked process');

const send = process.send.bind(process);

const startBot = async () =>
  new Promise((resolve) => {
    const wsClient = new WSClient('ws://localhost:3000');

    wsClient.on('close', () => {
      resolve(0);
    });

    wsClient.on('open', async () => {
      wsClient.on('message', (message) => {
        try {
          const parsedMessage = JSON.parse(message.toString());
          const data = JSON.parse(parsedMessage.data);

          if (
            parsedMessage.type === CommandType.REG &&
            'index' in data &&
            typeof data.index === 'number'
          )
            send({ type: 'bot_registration', data: { index: data.index } });
        } catch (e) {
          console.log(e);
        }
      });

      await handleRegistration(wsClient);
    });
  });

startBot().then((code) => process.exit(code === 0 ? 0 : 1));
