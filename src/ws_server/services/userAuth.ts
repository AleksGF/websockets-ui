import { connectDB } from '../dbServices/connectDB';
import { UserData, UserRegistrationResult } from '../types/commandTypes';

export const userAuth = async (
  userData: UserData,
): Promise<UserRegistrationResult> => {
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

  if (!authResult)
    return {
      error: true,
      errorText: 'Incorrect password',
    };

  return {
    name: userData.name,
    index: userIndex,
    error: false,
  };
};
