import { WebSocket } from 'ws';
import { CommandType } from '../../ws_server/types/commandTypes';
import { getRandomString } from '../services/registrationServices';

export const handleRegistration = async (wsClient: WebSocket) => {
  const name = 'bot_' + getRandomString(3);
  const password = getRandomString(8);

  wsClient.send(
    JSON.stringify({
      type: CommandType.REG,
      data: JSON.stringify({ name, password }),
      id: 0,
    }),
  );
};
