import { connectDB } from '../dbServices/connectDB';
import { AttackResultData, GameData, ShipData } from '../types/commandTypes';

const getShotIndexes = (
  enemyShips: number[][],
  attackCoords: number,
): [number, number] => {
  for (let i = 0; i < enemyShips.length; i++) {
    for (let j = 0; j < enemyShips[i].length; j++) {
      if (enemyShips[i][j] === attackCoords) {
        return [i, j];
      }
    }
  }

  return [-1, -1];
};

export const getAttackResult = async (
  gameId: number,
  indexPlayer: number,
  x: number,
  y: number,
): Promise<AttackResultData> => {
  const db = connectDB();

  const game = await db.getGameById(gameId);

  if (!game) throw new Error('Invalid game id');

  if (!game.ships[indexPlayer]) throw new Error('Invalid player id');

  const enemyIndex = Object.keys(game.ships).filter(
    (key) => key !== String(indexPlayer),
  )[0];

  if (!enemyIndex || Number.isNaN(Number(enemyIndex))) throw new Error();

  const enemyShips = game.ships[Number(enemyIndex)];

  if (!enemyShips) throw new Error();

  const attackCoords = x + y * 10;

  await db.addPlayerMove(gameId, indexPlayer, attackCoords);

  const shotIndexes = getShotIndexes(enemyShips, attackCoords);

  if (shotIndexes[0] === -1) {
    await db.toggleTurn(gameId);

    return {
      position: { x, y },
      currentPlayer: indexPlayer,
      status: 'miss',
    };
  }

  const updatedShips = await db.removeShotShip(
    gameId,
    Number(enemyIndex),
    shotIndexes,
  );

  if (updatedShips[shotIndexes[0]].length > 0)
    return {
      position: { x, y },
      currentPlayer: indexPlayer,
      status: 'shot',
    };

  return {
    position: { x, y },
    currentPlayer: indexPlayer,
    status: 'killed',
  };
};

export const getRandomCoords = async (
  game: GameData,
  indexPlayer: number,
): Promise<{ x: number; y: number }> => {
  let possibleMoves: number[] = [];

  for (let i = 0; i < 100; i++) {
    if (!game.moves[indexPlayer].has(i)) possibleMoves.push(i);
  }

  if (!possibleMoves.length) throw new Error('No possible moves');

  const randomIndex = Math.floor(Math.random() * possibleMoves.length);
  const randomMove = possibleMoves[randomIndex];

  return { x: randomMove % 10, y: Math.floor(randomMove / 10) };
};

export const getAroundKilledResults = async (
  gameId: number,
  indexPlayer: number,
  x: number,
  y: number,
): Promise<AttackResultData[]> => {
  const db = connectDB();

  const game = (await db.getGameById(gameId)) as GameData;
  const playerMoves = game.moves[indexPlayer];
  const enemyIndex = Number(
    Object.keys(game.ships).filter((key) => key !== String(indexPlayer))[0],
  );
  const enemyShipsData = game.shipsData[enemyIndex] as ShipData[];

  const ship = enemyShipsData
    .map((ship) => {
      const { position, direction, length } = ship;
      const shipCoords: number[] = [];

      for (let i = 0; i < length; i++) {
        if (direction) {
          const y = position.y + i;
          shipCoords.push(position.x + y * 10);
        } else {
          const x = position.x + i;
          shipCoords.push(x + position.y * 10);
        }
      }

      return shipCoords;
    })
    .filter((ship) => ship.includes(x + y * 10))[0];

  const aroundCoords: { x: number; y: number }[] = [];

  for await (const coord of ship) {
    for (let i = -1; i <= 1; i += 1) {
      for (let j = -1; j <= 1; j += 1) {
        const x = (coord % 10) + i;
        const y = Math.floor(coord / 10) + j;

        if (x < 0 || x > 9 || y < 0 || y > 9) continue;

        const newCoord = x + y * 10;

        if (ship.includes(newCoord) || playerMoves.has(newCoord)) continue;

        await db.addPlayerMove(gameId, indexPlayer, newCoord);
        aroundCoords.push({ x: newCoord % 10, y: Math.floor(newCoord / 10) });
      }
    }
  }

  return aroundCoords.map((coord) => ({
    position: coord,
    currentPlayer: indexPlayer,
    status: 'miss',
  }));
};

export const validateTurn = async (
  gameId: number,
  indexPlayer: number,
): Promise<void> => {
  const db = connectDB();

  const game = await db.getGameById(gameId);

  if (!game) throw new Error('Invalid game id');

  if (game.turn !== indexPlayer) throw new Error('Not your turn');
};

export const validateCoords = (x: unknown, y: unknown) => {
  if (typeof x !== 'number' || typeof y !== 'number')
    throw new Error('Invalid coords');

  if (isNaN(x) || isNaN(y)) throw new Error('Invalid coords');

  if (!Number.isInteger(x) || !Number.isInteger(y))
    throw new Error('Invalid coords');

  if (x < 0 || x > 9 || y < 0 || y > 9) throw new Error('Invalid coords');
};
