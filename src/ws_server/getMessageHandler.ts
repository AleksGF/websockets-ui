import { RawData, WebSocket } from 'ws';
import { getCommandRouter } from './commandRouter/commandRouter';

export const getMessageHandler =
  (ws: WebSocket) => async (message: RawData) => {
    const incomingCommand = message.toString();
    console.log(`Incoming message: ${incomingCommand}`);

    const handleCommand = getCommandRouter(ws);
    await handleCommand(incomingCommand);
  };
