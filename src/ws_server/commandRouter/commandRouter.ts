import { WebSocket } from 'ws';
import { validationErrorResponse } from '../constants/errors';
import { userAuth } from '../services/userAuth';
import { CommandType } from '../types/commandTypes';
import { getWsConnections } from '../wsConnections/getWsConnections';

const validateCommand = (command: unknown) => {
  if (
    !command ||
    typeof command !== 'object' ||
    !('type' in command) ||
    typeof command.type !== 'string' ||
    !Object.values(CommandType).includes(command.type as CommandType) ||
    !('data' in command) ||
    typeof command.data !== 'string' ||
    !('id' in command) ||
    command.id !== 0
  )
    throw new Error('Invalid command request');
};

export const getCommandRouter =
  (ws: WebSocket) => async (rawCommand: string) => {
    const wsConnections = getWsConnections();

    const doResponse = (result: string) => {
      console.log(`Result: ${result}\n`);
      ws.send(result);
    };

    try {
      const commandObj = JSON.parse(rawCommand);
      validateCommand(commandObj);

      switch (commandObj.type) {
        case CommandType.REG:
          const userAuthResultData = await userAuth(
            JSON.parse(commandObj.data),
          );

          if ('index' in userAuthResultData) {
            wsConnections.setNewConnection(ws, userAuthResultData.index);
          }

          doResponse(
            JSON.stringify({
              type: CommandType.REG,
              data: JSON.stringify(userAuthResultData),
              id: 0,
            }),
          );

          break;
      }
    } catch (e) {
      doResponse(validationErrorResponse);
    }
  };
