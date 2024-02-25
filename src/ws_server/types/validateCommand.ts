import { CommandType } from './commandTypes';

export const validateCommand = (command: unknown) => {
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
