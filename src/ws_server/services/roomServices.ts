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

  if (await db.isUserInSomeRoom(index))
    throw new Error('User already in another room');

  if (!(await db.isRoomAvailable(roomId)))
    throw new Error('Room is not available');

  return await db.addUserToRoom(index, roomId);
};
