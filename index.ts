import process from 'process';
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

httpServer.on('close', async () => {
  await new Promise<void>((resolve) => {
    const timeLimit = 10000;
    const startTime = Date.now();

    Array.from(wsServer.clients).forEach((client) => {
      client.on('close', () => {
        if (wsServer.clients.size === 0 || Date.now() - startTime > timeLimit)
          resolve();
      });

      client.terminate();
    });
  });

  await new Promise<void>((resolve) => {
    wsServer.on('close', () => {
      console.log('WebSocket server closed');
      resolve();
    });

    wsServer.close();
  });

  process.exit(0);
});

process.on('SIGINT', () => {
  httpServer.close();
  console.log('HTTP server closed');
});
