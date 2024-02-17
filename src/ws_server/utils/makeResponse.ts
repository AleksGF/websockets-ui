import { WebSocket } from 'ws';
import { CommandType, ResponseData } from '../types/commandTypes';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const makeResponse = (
  ws: WebSocket,
  type: CommandType | '',
  responseObj: ResponseData,
) => {
  const wsConnections = getWsConnections();

  const response = JSON.stringify({
    type,
    data: JSON.stringify(responseObj),
    id: 0,
  });

  console.log(`Result: ${response}\n`);

  if (type === CommandType.UPDATE_ROOM || type === CommandType.UPDATE_WINNERS) {
    for (const wsConnection of wsConnections.getConnections().keys()) {
      wsConnection.send(response);
    }
  } else {
    ws.send(response);
  }
};
