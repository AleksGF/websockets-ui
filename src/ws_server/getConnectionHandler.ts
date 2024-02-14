import { WebSocket } from 'ws';
import { getMessageHandler } from './getMessageHandler';

export const getConnectionHandler = () => (ws: WebSocket) => {
  ws.on('error', (error) => {
    console.log(error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('message', getMessageHandler(ws));
};
