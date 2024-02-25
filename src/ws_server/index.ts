import { Server } from 'ws';
import { getConnectionHandler } from './handlers/getConnectionHandler';

const WS_PORT = 3000;

export const wsServer = new Server({ port: WS_PORT }).on(
  'connection',
  getConnectionHandler(),
);
