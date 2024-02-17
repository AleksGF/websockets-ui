import { connectDB } from '../dbServices/connectDB';
import { UserData, UserRegistrationData } from '../types/commandTypes';

export const userAuth = async (
  userData: UserData,
): Promise<UserRegistrationData> => {
  const db = connectDB();

  const userIndex = await db.getUserIndex(userData.name);

  if (userIndex === undefined) {
    const newUser = await db.addUser(userData);

    return {
      name: userData.name,
      index: newUser.index,
      error: false,
    };
  }

  const authResult = await db.checkPassword(userIndex, userData.password);

  if (!authResult) throw new Error('Incorrect password');

  return {
    name: userData.name,
    index: userIndex,
    error: false,
  };
};
