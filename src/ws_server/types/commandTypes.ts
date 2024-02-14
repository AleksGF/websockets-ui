export type IncomingCommand = {
  type: CommandType.REG;
  data: UserData;
  id: 0;
};

export type OutgoingCommand = {
  type: CommandType.REG;
  data: string;
  id: 0;
};

export enum CommandType {
  REG = 'reg',
}

export type UserData = {
  name: string;
  password: string;
};

export type UserRegistrationResult =
  | UserRegistrationData
  | UserRegistrationError;

type UserRegistrationData = {
  name: string;
  index: number;
  error: false;
};

type UserRegistrationError = {
  error: true;
  errorText: string;
};
