import { connectDB } from '../dbServices/connectDB';
import { AddShipsData, GameData } from '../types/commandTypes';

export const createGame = async (roomId: number): Promise<GameData> => {
  const db = connectDB();

  if (!(await db.isRoomReady(roomId))) throw new Error('Room is not available');

  return await db.createGame(roomId);
};

export const verifyShipsData = async (
  shipsData: AddShipsData,
  index: number,
) => {
  const db = connectDB();
  const { gameId, ships, indexPlayer } = shipsData;

  const game = await db.getGameById(gameId);

  if (game === undefined) throw new Error('Invalid game id');

  if (game.players[indexPlayer] !== index) throw new Error('Invalid player id');

  if (ships.length !== 10) throw new Error('Invalid number of ships');

  if (ships.some((ship) => ship.length < 1 || ship.length > 4))
    throw new Error('Invalid ship length');

  if (
    ships.some(
      (ship) =>
        ship.type !== 'small' &&
        ship.type !== 'medium' &&
        ship.type !== 'large' &&
        ship.type !== 'huge',
    )
  )
    throw new Error('Invalid ship type');

  if (
    ships.some(
      (ship) =>
        ship.position.x < 0 ||
        ship.position.x > 9 ||
        ship.position.y < 0 ||
        ship.position.y > 9,
    )
  )
    throw new Error('Invalid ship position');

  if (
    ships.some(
      (ship) =>
        (ship.type === 'small' && ship.length !== 1) ||
        (ship.type === 'medium' && ship.length !== 2) ||
        (ship.type === 'large' && ship.length !== 3) ||
        (ship.type === 'huge' && ship.length !== 4),
    )
  )
    throw new Error('Invalid ship length');
};

export const addShipsToGame = async (shipsData: AddShipsData) => {
  const db = connectDB();
  const { ships } = shipsData;

  const shipsArray = ships.map((ship) => {
    const { position, direction, length } = ship;
    const shipCoords: number[] = [];

    for (let i = 0; i < length; i++) {
      if (direction) {
        const y = position.y + i;

        if (y > 9) throw new Error('Invalid ship position');

        shipCoords.push(position.x + y * 10);
      } else {
        const x = position.x + i;

        if (x > 9) throw new Error('Invalid ship position');

        shipCoords.push(x + position.y * 10);
      }
    }

    return shipCoords;
  });

  console.log(shipsData.ships.map((ship) => ship.position));
  console.log(shipsArray);

  return await db.addShipsToGame(shipsData, shipsArray);
};

export const getGameById = async (gameId: number) => {
  const db = connectDB();

  const game = await db.getGameById(gameId);

  if (!game) throw new Error('Invalid game id');

  return game;
};
