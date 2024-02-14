import { WebSocket } from 'ws';
import { getMessageHandler } from './getMessageHandler';
import { getWsConnections } from './wsConnections/getWsConnections';

export const getConnectionHandler = () => (ws: WebSocket) => {
  const wsConnections = getWsConnections();

  ws.on('error', (error) => {
    console.log(error);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    wsConnections.clearInactiveConnections();
  });

  ws.on('message', getMessageHandler(ws));
};
