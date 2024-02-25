import { WebSocket } from 'ws';
import { getMessageHandler } from './getMessageHandler';
import { getConnectionCloseHandler } from './getConnectionCloseHandler';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const getConnectionHandler = () => (ws: WebSocket) => {
  const wsConnections = getWsConnections();

  ws.on('error', (error) => {
    console.log(error);
  });

  ws.on('close', getConnectionCloseHandler(wsConnections));

  ws.on('message', getMessageHandler(ws));
};
