import { removeUsersFromRoom } from '../services/roomServices';
import { getWsConnections } from '../wsConnections/getWsConnections';

export const getConnectionCloseHandler =
  (wsConnections: ReturnType<typeof getWsConnections>) => async () => {
    console.log('WebSocket connection closed');

    const disconnectedUsers = wsConnections.clearInactiveConnections();

    await removeUsersFromRoom(disconnectedUsers);
  };
