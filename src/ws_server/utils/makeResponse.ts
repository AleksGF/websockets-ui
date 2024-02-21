import { WebSocket } from 'ws';
import { CommandType, ResponseData } from '../types/commandTypes';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const makeResponse = (
  receivers: number | number[] | WebSocket,
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

    return;
  }

  if (receivers instanceof WebSocket) {
    receivers.send(response);

    return;
  }

  if (Array.isArray(receivers)) {
    const usersWSes = receivers.map((receiver) => {
      const userWs = wsConnections.getWsByIndex(receiver);

      if (!userWs) throw new Error('User connection not found');

      return userWs;
    });

    usersWSes.forEach((userWs) => {
      userWs.send(response);
    });

    return;
  }

  const userWs = wsConnections.getWsByIndex(receivers);

  if (!userWs) throw new Error('User connection not found');

  userWs.send(response);
};
