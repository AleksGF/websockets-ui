import { connectDB } from '../dbServices/connectDB';
import { UpdateRoomData } from '../types/commandTypes';

export const getAvailableRooms = async (): Promise<UpdateRoomData> => {
  const db = connectDB();

  return await db.getAvailableRooms();
};

export const createRoom = async (index: number): Promise<UpdateRoomData> => {
  const db = connectDB();

  if (await db.isUserInSomeRoom(index))
    throw new Error('User already in another room');

  return await db.createRoom(index);
};

export const addUserToRoom = async (
  index: number,
  roomId: number,
): Promise<UpdateRoomData> => {
  const db = connectDB();

  //TODO add ability to add to already created by other user room
  if (await db.isUserInSomeRoom(index))
    throw new Error('User already in another room');

  if (!(await db.isRoomAvailable(roomId)))
    throw new Error('Room is not available');

  return await db.addUserToRoom(index, roomId);
};

export const removeRoom = async (index: number): Promise<void> => {
  const db = connectDB();

  await db.removeRoomByUserIndex(index);
};

export const removeUsersFromRoom = async (users: number[]) => {
  const db = connectDB();

  for await (const user of users) {
    await db.removeRoomByUserIndex(user);
  }
};
