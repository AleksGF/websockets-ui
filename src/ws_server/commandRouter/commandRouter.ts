import { WebSocket } from 'ws';
import { Command, CommandType } from '../types/commandTypes';
import { validateCommand } from '../types/validateCommand';
import { makeResponse } from '../utils/makeResponse';
import { getWsConnections } from '../wsConnections/getWsConnections';
import { addUserToRoomHandler } from './addUserToRoomHandler';
import { attackHandler, randomCoordsHandler } from './attackHandler';
import { authHandler } from './authHandler';
import { createRoomHandler } from './createRoomHandler';
import { startGameHandler } from './startGameHandler';

export const getCommandRouter =
  (ws: WebSocket) => async (rawCommand: string) => {
    let commandType: CommandType | '' = '';

    try {
      const commandObj: Command = JSON.parse(rawCommand);
      validateCommand(commandObj);
      commandType = commandObj.type;

      const wsConnections = getWsConnections();
      const index = wsConnections.getUserIndex(ws);

      if (index === undefined && commandType !== CommandType.REG) {
        makeResponse(ws, CommandType.REG, {
          error: true,
          errorText: 'Unauthorized user',
        });

        return;
      }

      switch (commandType) {
        case CommandType.REG:
          // TODO handle user exit and reenter
          await authHandler(ws, commandObj.data);
          break;

        case CommandType.CREATE_ROOM:
          await createRoomHandler(index as number, ws);
          break;

        case CommandType.ADD_USER_TO_ROOM:
          await addUserToRoomHandler(index as number, ws, commandObj.data);
          break;

        case CommandType.ADD_SHIPS:
          await startGameHandler(index as number, ws, commandObj.data);
          break;

        case CommandType.RANDOM_ATTACK:
          const coords = await randomCoordsHandler(ws, commandObj.data);

          if (coords) {
            const { x, y } = coords;
            await attackHandler(ws, commandObj.data, x, y);
          }

          break;

        case CommandType.ATTACK:
          await attackHandler(ws, commandObj.data);
          break;

        default:
          makeResponse(ws, commandType, {
            error: true,
            errorText: 'Invalid command type',
          });
      }
    } catch (e) {
      makeResponse(ws, commandType, {
        error: true,
        errorText: 'Invalid command request',
      });
    }
  };
