import { AddressInfo } from 'ws';
import { wsServer } from './src/ws_server';
import { httpServer } from './src/http_server';

const HTTP_PORT = 8181;

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server started on ${HTTP_PORT} port`);
  console.log(
    `WebSocket connection is ready on ${
      (wsServer.address() as AddressInfo).port
    } port`,
  );
});

httpServer.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit('connection', ws, request);
  });
});
