import { connectDB } from '../dbServices/connectDB';
import { GameData, UpdateWinnersData } from '../types/commandTypes';

export const getWinners = async (): Promise<UpdateWinnersData> => {
  const db = connectDB();

  return await db.getWinners();
};

export const isWinner = async (
  gameId: number,
  indexPlayer: number,
): Promise<boolean> => {
  const db = connectDB();

  const game = (await db.getGameById(gameId)) as GameData;
  const enemyIndex = Number(
    Object.keys(game.ships).filter((key) => key !== String(indexPlayer))[0],
  );
  const enemyShips = game.ships[enemyIndex];

  return enemyShips.every((ship) => ship.length === 0);
};

export const addWinner = async (index: number): Promise<void> => {
  const db = connectDB();

  const name = await db.getUserName(index);

  if (!name) throw new Error('Can`t get user name');

  await db.addWinner(name);
};
