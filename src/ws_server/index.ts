import ws from 'ws';

const WS_PORT = 3000;

export const wsServer = new ws.Server({ port: WS_PORT }).on(
  'connection',
  (ws) => {
    console.log(`WebSocket connection opened on port ${WS_PORT}`);

    ws.on('error', (error) => {
      console.log(error);
    });

    ws.on('message', (message) => {
      console.log(JSON.parse(message.toString()));
      ws.send(`You sent: ${message}`);
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  },
);
