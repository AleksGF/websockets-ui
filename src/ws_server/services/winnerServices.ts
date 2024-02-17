import { connectDB } from '../dbServices/connectDB';
import { UpdateWinnersData } from '../types/commandTypes';

export const getWinners = async (): Promise<UpdateWinnersData> => {
  const db = connectDB();

  return await db.getWinners();
};
